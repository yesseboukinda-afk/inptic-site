#!/usr/bin/env node
'use strict';

const { randomBytes, scryptSync, timingSafeEqual } = require('node:crypto');
const readline = require('node:readline');
const { Client } = require('pg');

function ask(question) {
  const terminal = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    terminal.question(question, (answer) => {
      terminal.close();
      resolve(answer.trim());
    });
  });
}

function askSecret(question) {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
    return Promise.reject(new Error('Cette commande doit être lancée dans un terminal interactif.'));
  }

  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    let value = '';

    const cleanup = () => {
      stdin.removeListener('data', onData);
      stdin.setRawMode(false);
      stdin.pause();
    };

    const onData = (chunk) => {
      for (const character of chunk.toString('utf8')) {
        if (character === '\u0003') {
          cleanup();
          process.stdout.write('\n');
          reject(new Error('Opération annulée.'));
          return;
        }
        if (character === '\r' || character === '\n') {
          cleanup();
          process.stdout.write('\n');
          resolve(value);
          return;
        }
        if (character === '\u007f' || character === '\b') {
          value = Array.from(value).slice(0, -1).join('');
        } else if (character >= ' ') {
          value += character;
        }
      }
    };

    process.stdout.write(question);
    stdin.resume();
    stdin.setRawMode(true);
    stdin.on('data', onData);
  });
}

function makePasswordHash(password) {
  const salt = randomBytes(16);
  const key = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}

function validateDatabaseUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error('URL PostgreSQL invalide.');
  }
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) {
    throw new Error('DATABASE_URL doit être une URL PostgreSQL.');
  }
}

async function main() {
  let databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    databaseUrl = await askSecret('URL DATABASE_URL de cPanel (saisie masquée) : ');
  }
  validateDatabaseUrl(databaseUrl);

  const email = (await ask('Adresse e-mail du compte administrateur : ')).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Adresse e-mail invalide.');
  }

  const name = await ask('Nom affiché : ');
  if (!name) {
    throw new Error('Le nom affiché ne peut pas être vide.');
  }

  const role = (await ask('Rôle du compte (admin/superadmin) : ')).toLowerCase();
  if (role !== 'admin' && role !== 'superadmin') {
    throw new Error('Le rôle doit être admin ou superadmin.');
  }
  let service = '';
  if (role === 'admin') {
    service = (await ask('Service attribué (scolarite/communication/direction_etudes/rh) : ')).toLowerCase();
    if (!['scolarite', 'communication', 'direction_etudes', 'rh'].includes(service)) {
      throw new Error('Le service doit être scolarite, communication, direction_etudes ou rh.');
    }
  }

  const password = await askSecret('Mot de passe du compte (saisie masquée) : ');
  if (!password || password.length > 256) {
    throw new Error('Le mot de passe doit contenir entre 1 et 256 caractères.');
  }
  const confirmation = await askSecret('Confirme le mot de passe : ');
  const passwordBuffer = Buffer.from(password);
  const confirmationBuffer = Buffer.from(confirmation);
  if (
    passwordBuffer.length !== confirmationBuffer.length ||
    !timingSafeEqual(passwordBuffer, confirmationBuffer)
  ) {
    throw new Error('Les deux mots de passe ne correspondent pas.');
  }

  const client = new Client({ connectionString: databaseUrl, connectionTimeoutMillis: 10000 });
  try {
    await client.connect();
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock($1)', [746123987654321]);

    const existing = await client.query(
      'SELECT 1 FROM public.app_users WHERE email = $1',
      [email],
    );
    if (existing.rowCount) {
      throw new Error('Un compte existe déjà avec cette adresse ; aucun compte n’a été modifié.');
    }

    const metadata = JSON.stringify({ name, full_name: name, role, service, department: service });
    const result = await client.query(
      `INSERT INTO public.app_users
         (email, password_hash, role, user_metadata, email_verified_at, must_reset_password)
       VALUES ($1, $2, $3, $4::jsonb, NOW(), FALSE)
       RETURNING email, role`,
      [email, makePasswordHash(password), role, metadata],
    );
    await client.query('COMMIT');

    console.log(`Compte ${result.rows[0].role} créé pour ${result.rows[0].email}${service ? ` (service : ${service})` : ''}.`);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    if (error instanceof Error && error.message.startsWith('Un compte existe déjà')) {
      throw error;
    }
    const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
    throw new Error(`Création impossible${code ? ` (erreur PostgreSQL ${code})` : ''}. Vérifie DATABASE_URL et le schéma de la base.`);
  } finally {
    await client.end().catch(() => {});
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Création impossible.');
  process.exitCode = 1;
});
