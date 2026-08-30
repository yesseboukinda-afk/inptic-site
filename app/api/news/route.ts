import {NextResponse} from 'next/server';import {strapi} from '@/lib/strapi';
export async function GET(){try{return NextResponse.json(await strapi('/actualites?populate=*&sort=publishedAt:desc'))}catch(e){return NextResponse.json({error:'API actualités indisponible'}, {status:502})}}
