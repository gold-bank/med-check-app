import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

// FCM Init
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
        });
        console.log('Firebase Admin Initialized for Medicine Check.');
    } catch (error) {
        console.error('Firebase Admin Init Failed:', error);
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { deviceId, slotId, date, checked } = body;

        if (!deviceId || !slotId || !date) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const db = admin.firestore();
        const docId = `${deviceId}_${slotId}_${date}`;

        if (checked) {
            await db.collection('medicine_checks').doc(docId).set({
                deviceId,
                slotId,
                date,
                checked: true,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`[DB] Ckecked marked: ${docId}`);
        } else {
            await db.collection('medicine_checks').doc(docId).delete();
            console.log(`[DB] Ckecked deleted: ${docId}`);
        }

        return NextResponse.json({ success: true, docId, checked });
    } catch (error: any) {
        console.error('[API Error] medicine-check:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
