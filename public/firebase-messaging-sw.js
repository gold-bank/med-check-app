// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyBIXcgKCgoWy-nNS1-uGZaKRZirliPjVZg",
    authDomain: "med-check-app-c4ee9.firebaseapp.com",
    projectId: "med-check-app-c4ee9",
    storageBucket: "med-check-app-c4ee9.firebasestorage.app",
    messagingSenderId: "290380737299",
    appId: "1:290380737299:web:904b39389da696eb6a08e6",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: payload.notification.icon || '/pill-icon.png',
        badge: payload.notification.badge || '/pill-icon.png',
        // 클릭 시 동작 설정
        data: payload.data
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
