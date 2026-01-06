# ⛓️ Zinciri Kırma (Don't Break the Chain) - Proje Planı

Bu uygulama, kullanıcıların alışkanlıklarını görsel bir "zincir" metaforu üzerinden takip etmelerini sağlayan, yüksek etkileşimli ve animasyon odaklı bir motivasyon platformudur.

---

## 🚀 1. Temel Konsept
Kullanıcı bir hedef belirler ve her gün bu hedefi tamamladığında takvimde ilgili günü işaretler. Yan yana gelen günler otomatik olarak "akışkan bir zincir" ile bağlanır. Amaç: **Zinciri asla koparmamak.**

---

## 🛠️ 2. Teknik Mimari (Tech Stack)

### Core Stack
* **Frontend:** React (Web) veya React Native (Mobil)
* **State Management:** Zustand (Hızlı ve hafif streak takibi için)
* **Backend:** Firebase (Real-time DB ve Push Notification)

### Animasyon Katmanı (Premium Feel)
* **Framer Motion:** Sayfa geçişleri ve mikro-etkileşimler (yaylı fizik motoru).
* **Lottie:** Başarı kutlamaları ve "Achievement" ikonları.
* **SVG Path Animation:** Günleri birbirine bağlayan "akışkan zincir" efekti.
* **Web Vibrate API:** İşaretleme anında dokunsal geri bildirim (Haptic Feedback).

---

## 📊 3. Veri Yapısı (Schema)

Uygulamanın hem mantık hem de görsel efektleri besleyen veri modeli:

```json
{
  "habit_id": "habit_101",
  "user_id": "user_45",
  "title": "Günde 30 Dakika Yazılım Çalış",
  "color": "#4F46E5",
  "animation_style": "liquid_connection",
  "logs": [
    { "date": "2024-05-01", "completed": true },
    { "date": "2024-05-02", "completed": true }
  ],
  "streak_data": {
    "current_streak": 2,
    "longest_streak": 15
  }
}
```

---

## ✨ 4. Animasyon Stratejisi

### A. Mikro Etkileşimler (Anlık Tepki)

**Check-in Hareketi:** Kullanıcı "Tamamladım" dediğinde, buton bir yay (spring) etkisiyle içeri çöker ve etrafa küçük partiküller yayılır.

**Halka Oluşumu:** Günlük kutucuk işaretlendiğinde, içi merkezden dışa doğru bir sıvı doluyormuş gibi boyanır.

### B. Zincirleme Efekti (Görsel Bağlantı)

İki ardışık gün işaretlendiğinde, kutucukların arasındaki boşluk bir SVG Bezier Curve animasyonu ile dolar. Bu, statik bir çizgiden ziyade, birbirine "mıknatıslanmış" iki sıvı damlasının birleşmesi gibi görünmelidir.

### C. Başarı Kutlamaları

- **7 Gün (Haftalık Seri):** Takvim üzerinde altın renkli bir parlama efekti.
- **Zincir Kırılması:** Zincir koptuğunda, halkaların "çatırdama" efektiyle birbirinden ayrılması (Kullanıcıya kayıp hissini görsel olarak hissettirmek için).

---

## 📱 5. Uygulama Modülleri

- **Dashboard (Akış Ekranı):** Tüm aktif alışkanlıkların ve mevcut streak sayılarının listesi.
- **İnteraktif Takvim:** Zincirin görselleştirildiği, zoom yapılabilen ana alan.
- **Dopamin Merkezi:** Kazanılan rozetlerin ve en uzun serilerin sergilendiği istatistik ekranı.

---

## 🛠️ 6. Kurulum

### Gereksinimler
- Node.js 18+ 
- npm veya yarn
- Firebase projesi

### Adımlar

1. **Bağımlılıkları yükleyin:**
   ```bash
   npm install
   ```

2. **Firebase yapılandırması:**
   - Firebase Console'da yeni bir proje oluşturun: https://console.firebase.google.com/
   - Firestore Database'i etkinleştirin (Test mode ile başlayabilirsiniz)
   - Project Settings > General > Your apps bölümünden web app yapılandırmanızı alın
   - Proje kök dizininde `.env.local` dosyası oluşturun:
     ```env
     NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
     NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
     ```

3. **Firestore Security Rules (Test için):**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /habits/{document=**} {
         allow read, write: if true; // Test için - production'da güvenlik kuralları ekleyin
       }
     }
   }
   ```

4. **Uygulamayı çalıştırın:**
   ```bash
   npm run dev
   ```

5. Tarayıcıda `http://localhost:3000` adresine gidin.

---

## 🛠️ 7. Geliştirme Yol Haritası

- [x] **Faz 1:** Takvim grid yapısının ve temel CRUD işlemlerinin kodlanması.
- [x] **Faz 2:** Streak hesaplama algoritmasının (ardışık gün kontrolü) yazılması.
- [x] **Faz 3:** Framer Motion ile temel giriş/çıkış animasyonlarının eklenmesi.
- [x] **Faz 4:** SVG tabanlı "Zincir Bağlama" animasyonunun entegrasyonu.
- [ ] **Faz 5:** Bildirimler ve "Hatırlatıcı" sisteminin kurulması.

---

> **Motto:** "Basitlik ve süreklilik, karmaşık ve düzensiz motivasyondan her zaman üstündür."