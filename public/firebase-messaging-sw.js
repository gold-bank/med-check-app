importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// 중요: 사용자가 여기에 자신의 firebaseConfig 값을 직접 붙여넣어야 함
// .env 파일의 값을 여기서는 읽을 수 없기 때문입니다.
const firebaseConfig = {
    apiKey: "AIzaSyBIXcgKCgoWy-nNS1-uGZaKRZirliPjVZg",
    authDomain: "med-check-app-c4ee9.firebaseapp.com",
    projectId: "med-check-app-c4ee9",
    storageBucket: "med-check-app-c4ee9.firebasestorage.app",
    messagingSenderId: "290380737299",
    appId: "1:290380737299:web:904b39389da696eb6a08e6"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/pill-icon.png', // 아이콘 경로 확인 필요
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
