// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCTeVviTG-vOoTDb7Q9EQR9O7b01oAKIP4",
  authDomain: "inbox-detoxer-5a8bf.firebaseapp.com",
  projectId: "inbox-detoxer-5a8bf",
  storageBucket: "inbox-detoxer-5a8bf.firebasestorage.app",
  messagingSenderId: "288707209965",
  appId: "1:288707209965:web:9db66a4d392134b3693ae4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export default app;