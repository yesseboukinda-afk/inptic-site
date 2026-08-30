import {NextResponse} from 'next/server';import {strapi} from '@/lib/strapi';
export async function GET(){try{return NextResponse.json(await strapi('/formations?populate=*'))}catch(e){return NextResponse.json({error:'API formations indisponible'}, {status:502})}}
