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

// 백그라운드 메시지 수신 리스너
// 서버에서 'notification' 필드를 포함하여 보내므로, SDK가 자동으로 시스템 알림을 표시합니다.
// 따라서 여기서 showNotification을 직접 호출하면 알림이 중복으로 발생하므로 주석 처리하거나 제거해야 합니다.
/*
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    // 중복 방지를 위해 수동 알림 표시 로직 제거
});
*/
