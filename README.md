![PostureGuard](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/General_Documents/LOGO.png)

# **Takım İsmi**

Takım AI 116

## Team Members

| Name | Title | Social |
|:-------:| :-----:| :--------:|
| <a href="https://github.com/bogusbeyza" style="text-decoration:none; color:blue;">Beyza Boğuş</a> | Scrum Master | [<img src="https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png" alt="LinkedIn" width="20"/>](https://www.linkedin.com/in/beyzabogus/) |
| <a href="https://github.com/gulbahar-donmez" style="text-decoration:none; color:blue;">Gülbahar Dönmez</a> | Product Owner | [<img src="https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png" alt="LinkedIn" width="20"/>](https://www.linkedin.com/in/gulbahardonmez/) |
| <a href="https://github.com/OnurDaglar" style="text-decoration:none; color:blue;">Onur Dağlar</a> | Developer | [<img src="https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png" alt="LinkedIn" width="20"/>](https://www.linkedin.com/in/onur-daglar-462b58252/) |
| <a href="https://github.com/BerhakTanyildizi" style="text-decoration:none; color:blue;">Berhak Tanyıldızı</a> | Developer | [<img src="https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png" alt="LinkedIn" width="20"/>](https://www.linkedin.com/in/mahmut-berhak-tany%C4%B1ld%C4%B1z%C4%B1-56bb10302/) |

---
### Ürün Açıklaması

**Ürün İsmi:** PostureGuard

**Problem:** Uzaktan çalışma ve dijital yaşamın artmasıyla birlikte milyonlarca insan, farkında olmadan edindikleri duruş bozuklukları nedeniyle kronik ağrılar ve sağlık sorunları riskiyle karşı karşıya. Bu sorun genellikle yavaş yavaş geliştiği için anlık olarak fark edilmesi ve düzeltilmesi zordur. Standart hatırlatıcılar, kullanıcının gerçek duruşundan bağımsız olduğu için kolayca göz ardı edilir ve bir süre sonra "gürültü" haline gelir.

**Çözüm:** PostureGuard, bu probleme modern bir çözüm sunar. Kullanıcının mevcut web kamerasını kullanarak, yapay zeka destekli iskelet takibi ile duruşunu gerçek zamanlı olarak analiz eder. Başın öne eğilmesi veya omuzların düşmesi gibi ergonomik hataları anında tespit ederek kullanıcıyı nazik, görsel ve işitsel uyarılarla bilgilendirir. Amacımız teşhis koymak değil, proaktif bir yaklaşımla sağlıklı duruş alışkanlıkları kazandırmaktır.

<details>
<summary><h2>Ürün Özellikleri</h2></summary>
<br>

**Gerçek Zamanlı Analiz ve Geri Bildirim:**
*   **Webcam ile Anlık Analiz:** Ek bir donanıma ihtiyaç duymadan, standart web kamerası üzerinden duruş analizi.
*   **Anlık Uyarı Sistemi:** `bad_posture` durumunda görsel ve işitsel bildirimler, `good_posture` durumunda ise bu uyarıların normale dönmesi.
*   **3B Model ile Görselleştirme:** Analiz sonuçlarının ve riskli bölgelerin 3 boyutlu insan modeli üzerinde dinamik olarak (kırmızı/sarı/yeşil) gösterilmesi.

**Yapay Zeka ve Raporlama:**
*   **AI Destekli Kişiselleştirilmiş Öneriler:** Gemini AI entegrasyonu ile canlı analiz sırasında ve raporlarda kişiye özel duruş önerileri.
*   **Detaylı PDF Raporları:** Tamamlanan canlı analiz ve fotoğraf ile analiz oturumları için indirilebilir PDF raporları.
*   **Akıllı Chatbot (PostureGuide):** RAG mimarisi ile desteklenen, sesli komutla kullanılabilen ve kullanıcının sorularına anlık yanıtlar veren chatbot.

**Kullanıcı Deneyimi ve Kişiselleştirme:**
*   **Kullanıcı Profili ve İlerleme Takibi:** Kullanıcıların geçmiş analiz sonuçlarını ve gelişim grafiklerini takip edebildiği kişisel panel.
*   **Kişiselleştirilebilir Avatarlar:** `react-nice-avatar` kütüphanesi ile kullanıcıların kendi avatarlarını oluşturabilmesi.
*   **Açık ve Koyu Mod Desteği:** Kullanıcı tercihine göre değiştirilebilen arayüz teması.

**Platform ve Erişilebilirlik:**
*   **Tam Fonksiyonlu Mobil Uygulama:** React Native ile geliştirilecek olan, web platformundaki tüm özelliklere sahip iOS ve Android uygulaması.
*   **Güvenli Kimlik Doğrulama:** E-posta/şifre ile kayıt ve Google (OAuth 2.0) ile güvenli giriş seçenekleri.


**Sıkça Sorulan Sorular:** [SSS](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/General_Documents/SSS.pdf)
</details>

<details>
<summary><h2>Hedef Kitle</h2></summary>
<br>
Gününün önemli bir kısmını masa başında bilgisayar karşısında geçiren kişiler:

*   Masa başı çalışan kurumsal profesyoneller.
*   Uzaktan çalışanlar (Home office).
*   Uzun saatler ders çalışan üniversite öğrencileri.
*   E-spor oyuncuları ve yayıncılar.

**Persona Dosyası:** [Personalar](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/General_Documents/Personalar.pdf) 
</details>

<details>
<summary><h2>Proje Dokümantasyonu</h2></summary>
<br>

Bu bölümde, projenin temelini oluşturan ve teknik yapısını açıklayan ana dokümanları bulabilirsiniz.

*   **Proje Tüzüğü:** Projenin vizyonunu, hedeflerini, kapsamını ve çıktılarını tanımlayan temel belge.
    *   [Proje Tüzüğü PDF'ini Görüntüle](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/General_Documents/Posture_Guard_Project_Charter.pdf)

</details>


<details>
<summary><h2>Teknik Yapı ve Mimari</h2></summary>
<br>

Projemiz, modern ve ölçeklenebilir teknolojiler kullanılarak geliştirilmiştir. Backend ve frontend arasındaki veri akışını ve API yapısını aşağıdaki dokümanda bulabilirsiniz.

*   [Endpoint Akışı PDF'ini Görüntüle](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/General_Documents/Posture%20Guard%20Endpoint%20Akışı.pdf)

**Kullanılan Teknolojiler:** React, Node.js, Python, PostgreSQL, Docker, Nginx, vb.

</details>

## Product Backlog URL

[Asana Backlog Board](https://app.asana.com/1/1210679212645128/project/1210679513423891/list/1210679225424154) (Sprint 2'de Notion geçiş yapılmıştır.)  
[Notion Backlog Board](https://www.notion.so/232030b633d280fe80d6e7b199436fd8?v=232030b633d2808a92c9000c2642ee88&source=copy_link)


---





![Sprints](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/General_Documents/Github_Pages/Sprint.png)

---
<details>
  <summary><h1>Sprint 1</h1></summary>

  ---
<details>
    <summary><h2>Web Screenshots</h2></summary>

### Login Page
![Loginpage](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_1/Sprint_1_App_SS/Login_Page.png)

---
### Home Page
![Homepage](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_1/Sprint_1_App_SS/Home_Page.png)

---
### Analyzer Page
![Analyzpage](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_1/Sprint_1_App_SS/Analyz_Page.png)


---
### Signup Page
![Signuppage](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_1/Sprint_1_App_SS/Signup_Page.png)

---
### AboutUS Page
![Aboutuspage](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_1/Sprint_1_App_SS/About_Us_page.png)

---
### Contact Page
![Contactpage](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_1/Sprint_1_App_SS/contact_page.png)




   
</details>

---
  <details>
    <summary><h2>App Map</h2></summary>

![App Flowchart](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_1/Sprint_1_App_Map/App_Map.png)
   
  </details>

---
  <details>
    <summary><h2>Project Management</h2></summary>
    
![asana_1.1](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_1/Sprint_1_pm/Asana_1.1.png)
![asana_1.2](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_1/Sprint_1_pm/Asana_1.2.png)
![asana_1.3](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_1/Sprint_1_pm/Asana_1.3.png)
![asana_1.4](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_1/Sprint_1_pm/Asana_1.4.png)
   
  </details>

---
  <details>
    <summary><h2>Burndown Chart</h2></summary>

![Burndown Chart](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_1/Sprint_1_Burndown_Chart/Sprint_1_Burndown_Chart.png)


    
  </details>

---



- **Sprint Notları:**
   * UI/UX Tasarımı: Arayüz geliştirmeleri için modern ve dinamik bir yapı sunan _`React.js`_ kütüphanesinin kullanılmasına karar verildi.
   * Görev takibi, sprint planlaması ve genel proje yönetimi için _`Asana`_  aracı benimsendi.
   * Günlük scrum toplantıları ve diğer ekip görüşmeleri, takımın müsaitlik durumuna göre _`Google Meet`_  üzerinden gerçekleştirildi.

 
 
- **Sprint İçinde Tamamlanması Beklenen Puan:**
  * `100` Puan

- **Puan Tamamlama Mantığı:**
  * Toplamda `400` puanlık bir hedef belirlendi. Birinci sprintte, takım değişiklikleri ve fikrin benimsenmesi sürecinden dolayı `100` puan hedeflenmiştir ve tamamlanmıştır. İkinci sprintte, API ekleme ve entegrasyon çalışmalarına yoğunlaşılacağı için `150` puan hedeflenmiştir. Üçüncü sprintte ise kalan görevlerin tamamlanması, entegrasyon ve canlıya alma çalışmaları yapılacağından `150` puan hedefi konulmuştur.

  **Daily Scrum:** [Sprint 1 Daily Scrum](https://github.com/gulbahar-donmez/Team-116/tree/master/Project_Management_Files/Sprint_1/Sprint_1_Daily_Scrum)

- **Sprint Gözden Geçirilmesi:**
   * Proje takibi için Asana kullanıldı. Başlangıçta görevlere tarih girilmedi, ancak sprint sonunda Burndown Chart oluşturabilmek amacıyla tarihler toplu olarak eklendi.
   * Projenin ana fikri Beyza tarafından üretildi. Fikrin potansiyelini göstermek amacıyla, statik bir görsel üzerinde başarılı bir postür analizi denemesi gerçekleştirildi ve bu prototip üzerinden ilerleme kararı alındı.
   * Onur tarafından yapılan isim ve logo çalışmaları incelendi. Ekip tarafından ortak bir kararla projeye "PostureGuard" adı verildi ve sunulan katalog üzerinden logo seçimi yapıldı.
   * Berhak tarafından başlangıçta HTML ile bir arayüz tasarımı yapıldı. Projenin ihtiyaç duyduğu dinamik yapı göz önünde bulundurularak, geliştirmenin React ile devam etmesine karar verildi. 
   * Tam kapsamlı kullanıcı girişi ve kayıt sistemi geliştirildi. (Login/SignUp Page)
   * React.js teknolojisi kullanılarak backend entegrasyonu iyileştirme çalışmaları yürütüldü. 
   * Mobil uyumlu responsive tasarım ve dinamik parçacık animasyonları ile zenginleştirildi.
   * Görsel Yükleme(JPG, PNG, WEBP formatlarında) ve Duruş Analizi Sistemi hazırlandı.
   * HTTP client katmanı üzerine kurulmuş authentication ve posture servis katmanları oluşturuldu.
   * Login, Home, Analyz, AboutUs ve Contact Page tasarımları Berhat tarafından tamamlandı.
   * Backend geliştirmeleri Gülbahar tarafından yürütüldü. Bu kapsamda, live_posture ve posture_analyzer adlarıyla hem canlı hem de statik görüntüden duruş analizi yapabilen iki farklı fonksiyon hazırlandı. Ayrıca, bir destek mail adresi kurarak uygulamanın 'İletişim' (Contact) bölümünü işlevsel hale getirildi.
   * Proje yönetimi ve dokümantasyon süreçlerini yürüten Beyza, ürün tanıtım dosyası, iş planı kanvası (yalın kanvas), Sıkça Sorulan Sorular, hedef kitle/persona dosyaları, burndown chart ve uygulama haritası gibi temel proje belgelerini hazırlayarak görev takibini Asana üzerinden gerçekleştirdi.
   * Geliştirme hedefi olarak, kullanıcıların duruş verilerinin veritabanında saklanması ve bu veriler analiz edilerek kişiye özel egzersiz tavsiyeleri sunulması kararlaştırıldı.
   * Ekibin yeni kurulmuş olmasına rağmen, kısa sürede önemli bir ilerleme kaydedildi ve genel olarak oldukça verimli bir sprint süreci geçirildiği değerlendirildi.
     

- **Sprint Gözden Geçirme Katılımcıları:**
    * `Beyza Boğuş, Gülbahar Dönmez, Onur Dağlar, Berhak Tanyıldızı`

- **Sprint Retrospektifi:**
   * Tüm ekip üyelerinin ikinci sprintte birlikte kod yazmasına karar verildi.
   * Frontend (React) ile Backend (Python) arasında veri alışverişini sağlayacak temel API endpoint'lerinin (örneğin, /start_analysis, /get_user_data) geliştirilmesine karar verildi.
   * Canlı analiz sırasında elde edilen önemli verilerin (örneğin, duruş bozukluğu sayısı, analiz süresi) kullanıcının profiline özel olarak veritabanına kaydedilmesi fonksiyonunun geliştirilmesine karar verildi. 
   * Frontend'in backend'deki analiz motoruyla anlık olarak konuşabilmesi için WebSocket veya benzeri bir teknolojinin araştırılıp entegre edilmesine karar verildi.
   * Duruş bozukluğu tespit edildiğinde kullanıcıyı uyaracak görsel elementlerin (örneğin, ekran çerçevesinin kırmızıya dönmesi, uyarı metni) eklenmesine karar verildi.
   * Bir önceki sprintten alınan dersle, bu sprintte görevlerin ve tamamlanma durumlarının Asana'ya günlük ve anlık olarak işlenmesine, böylece Burndown Chart'ın canlı bir şekilde takip edilmesine karar verildi.

</details>


---
<details>
  <summary><h1>Sprint 2</h1></summary>

  ---

<details>
    <summary><h2>Web Screenshots</h2></summary>

### Login Page
![Loginpage](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_2/Sprint_2_App_SS/Login_Page.png)

---
### Signup Page
![Signuppage](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_2/Sprint_2_App_SS/Sign_Up_Page.png)

---
### Home Page
![Homepage](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_2/Sprint_2_App_SS/Home_Page.png)

---
### Analyzer Page
![Photoanalysis](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_2/Sprint_2_App_SS/Photo_Analysis.png)
![Photoanalysis](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_2/Sprint_2_App_SS/Photo_Analysis_2.png)
![Liveanalysis](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_2/Sprint_2_App_SS/Live_Analysis.png)

---

### Calibration Page
![Calibrationpage](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_2/Sprint_2_App_SS/Calibration_Page.png)

---

### Dashboard Page
![Dashboardpage](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_2/Sprint_2_App_SS/Dashboard.png)

---

### About Us Page
![Aboutuspage](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_2/Sprint_2_App_SS/About_Us_Page.png)

---
### Contact Page
![Contactpage](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_2/Sprint_2_App_SS/Contact_Page.png)

---
### Profile Page
![Profilepage](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_2/Sprint_2_App_SS/Profile_Page.png)

---
### Security Page
![Securitypage](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_2/Sprint_2_App_SS/Security_Page.png)


---
### Delete Account Page
![Deleteaccountpage](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_2/Sprint_2_App_SS/Delete_Account_Page.png)

---

### 3D Model
![3Dmode](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_2/Sprint_2_App_SS/3B_Model.jpeg)


   
</details>

---

<details>
  <summary><h2>Project Management</h2></summary>
    
 ![Notion_2.1](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_2/Sprint_2_pm/Notion_2.1.png)
 ![Notion_2.2](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_2/Sprint_2_pm/Notion_2.2.png)
 ![Notion_2.3](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_2/Sprint_2_pm/Notion_2.3.png)
 ![Notion_2.4](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_2/Sprint_2_pm/Notion_2.4.png) 
</details>

---
  <details>
    <summary><h2>Burndown Chart</h2></summary>

   ![Burndown Chart](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_2/Sprint_2_Burndown_Chart/Sprint_2_Burndown_Chart.png)

  </details>

---


- **Sprint Notları:**
   * Bu sprint, projenin kullanıcı deneyimini ve temel işlevselliğini bir üst seviyeye taşımaya odaklandı.
   * Görev takibi, sprint planlaması ve proje yönetimi için ilk sprintte Asana kullanılmışken ücretlendirme politikasından dolayı _`Notion`_ aracına geçiş yapılmıştır.
   * Günlük scrum toplantıları ve diğer ekip görüşmeleri, takımın müsaitlik durumuna göre _`Google Meet`_ ve _`Whatsapp`_   üzerinden gerçekleştirildi.
   * Kullanıcı profilleri, fotoğraf ile analiz sonuçları, ve diğer tüm uygulama verilerinin depolanması için _`PostgreSQL`_  veritabanı kullanıldı.
   * Anlık görüntü işleme ve performans optimizasyonları için _`C++`_ entegrasyonu yapıldı.
   * Kullanıcıya daha etkili görsel geri bildirim sağlamak amacıyla _`Blender`_ ile 3B modelleme çalışmaları gerçekleştirildi.
   * Kullanıcı sorularına hızlı ve doğru yanıtlar verebilmek için _`RAG`_ (Retrieval-Augmented Generation) kullanıldı.
 
- **Sprint İçinde Tamamlanması Beklenen Puan:**
  * `150`

- **Puan Tamamlama Mantığı:**
  * Toplamda `400` puanlık bir hedef belirlendi. Birinci sprintte `100` puan tamamlanmıştır. İkinci sprintte, kodların genel olarak tamamlanması istenilmiş `150` puan hedefi konulmuş ve tamamlanmıştır. Üçüncü sprintte, kullanıcı deneyimini geliştirecek ve sistemin işlevselliğini artıracak görevler için yine `150` puan hedeflenmiştir.
  
  **Daily Scrum:** [Sprint 2 Daily Scrum](https://github.com/gulbahar-donmez/Team-116/tree/master/Project_Management_Files/Sprint_2/Sprint_2_Daily_Scrum)

- **Sprint Gözden Geçirilmesi:**
   * Ürünün gelişmesine verdiği katkılardan dolayı Product Owner ekip kararı ile Gülbahar olarak değitirildi.
   * Gerçek zamanlı analiz özelliği başarıyla hayata geçirildi. Ancak, kullanıcıya görsel veya sesli uyarı gönderme özelliği henüz eklenmedi. 3. sprintte, bu özelliğin geliştirilmesine odaklanılacaktır.
   * İnsan modeli üzerinden kullanıcının duruş bozukluğu yaşadığı bölgelerin 3B model üzerinden gösterilmesi için 23 farklı bölge ayırt edildi.
   * Kullanıcıların duruşlarını fotoğraf üzerinden analiz etme özelliği(posture_analyzer) başarıyla tamamlandı. Bu özellik, omuz üstü ve tüm vücut olarak 2 farklı analizi gerçekleştirmektedir.
   * Kullanıcılara, analiz öncesinde analizlerin doğruluğunu artırmak amacıyla uygulanan Kalibrasyon sayfası tasarımı tamamlandı
   * Kullanıcı panelindeki gelişim grafiklerinin ve raporlama özelliklerinin daha detaylı hale getirilmesi kararlaştırıldı.
   * Dark Mode ve Light Mode seçenekleri eklenerek kullanıcıya kişiselleştirilmiş bir deneyim sunuldu.
   * Kullanıcıların sorularına daha hızlı ve doğru yanıtlar verebilmek amacıyla, Google Gemini Embedding 001 modeli kullanılarak oluşturulan embedding vektörleri ile desteklenen Retrieval-Augmented Generation (RAG) mimarisi üzerine, chatbot inşa edilmiştir.
     

- **Sprint Gözden Geçirme Katılımcıları:**
    * `Beyza Boğuş, Gülbahar Dönmez, Onur Dağlar, Berhak Tanyıldızı`

- **Sprint Retrospektifi:**
   * Kullanıcı deneyimini artırmak için görsel ve sesli uyarı sisteminin geliştirilmesine karar verildi.(Good_Posture ve Bad_Posture)
   * Kullanıcıya daha etkili geri bildirim sağlamak için 3B modelleme çalışmaları ile analiz sonuçları arasında entegrasyon çalışmaları yürütülecek.
   * Canlı analiz sonuçlarının veritabanına kaydedilmesi(Live_Session) ve kullanıcıya sunulması için gerekli altyapı oluşturulacak. Bu özellik tamamlandığında, kullanıcı "Sonuçlarım" ekranından görsel ile analizde olduğu gibi canlı analiz sonuçlarını da görüntüleyip PDF rapor indirebilecektir.
   * RAG mimarisi ile kurulan chatbot'un entegrasyon çalışmaları yürütülecektir.
   * Uygulamanın genel performans optimizasyonu ve canlıya alma (deployment) süreçleri için son hazırlıkların yapılmasına karar verildi.

</details>

---
<details>
  <summary><h1>Sprint 3</h1></summary>

  ---

<details>
    <summary><h2>Web Screenshots</h2></summary>

### Authentication Pages
![Login Page](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_3/Sprint_3_App_SS/Login_Page.png?raw=true)
![Signup Page](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_3/Sprint_3_App_SS/Sign_Up_Page.png?raw=true)
![Forgot Password Page](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_3/Sprint_3_App_SS/Forgot_Password_Page.png?raw=true)
![Google Auth](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_3/Sprint_3_App_SS/Google_Auth.png?raw=true)

---
### Home Page
![Homepage](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_3/Sprint_3_App_SS/Home_Page.png?raw=true)

---
### Analysis Pages
![Photo Analysis Page](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_3/Sprint_3_App_SS/Photo_Analysis.png?raw=true)
![Live Analysis Page](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_3/Sprint_3_App_SS/Live_Analysis.png?raw=true)
![Calibration Page](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_3/Sprint_3_App_SS/Calibration_Page.png?raw=true)

---

### Dashboard & Results
![Dashboard Page](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_3/Sprint_3_App_SS/Dashboard.png?raw=true)
![3D Model Page](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_3/Sprint_3_App_SS/3D_Model.png?raw=true)

---

### Chatbot (PostureGuide)
![Chatbot Main](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_3/Sprint_3_App_SS/Chatbot.png?raw=true)
![Chatbot Guide](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_3/Sprint_3_App_SS/Chatbot_Guide.png?raw=true)
![Chatbot Analysis](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_3/Sprint_3_App_SS/Chatbot_Analys.png?raw=true)
![Chatbot Ended Chat](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_3/Sprint_3_App_SS/Chatbot_Ended_Chat.png?raw=true)

---

### Profile & Account Settings
![Account Settings Page](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_3/Sprint_3_App_SS/Account_Settings_Page.png?raw=true)
![Avatar Page](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_3/Sprint_3_App_SS/Avatar_Page.png?raw=true)
![Delete Account Page](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_3/Sprint_3_App_SS/Delete_Account_Page.png?raw=true)

---

### Static Pages
![About Us Page](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_3/Sprint_3_App_SS/About_Us_Page.png?raw=true)

---

### PDF Report Example
[Download Example PDF Report](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_3/Sprint_3_App_SS/durusanalizi_raporu_2025-08-03.pdf)

---
   
</details>
</details>
---

<details>
  <summary><h2>Project Management</h2></summary>
    
 ![Notion_3.1](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_3/Sprint_3_pm/Notion_3.1.png?raw=true)
 ![Notion_3.2](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_3/Sprint_3_pm/Notion_3.2.png?raw=true)
 ![Notion_3.3](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_3/Sprint_3_pm/Notion_3.3.png?raw=true)
 ![Notion_3.4](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_3/Sprint_3_pm/Notion_3.4.png?raw=true)
 ![Notion_3.5](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_3/Sprint_3_pm/Notion_3.5.png?raw=true)
 
</details>

---
  <details>
    <summary><h2>Burndown Chart</h2></summary>

   ![Burndown Chart](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/Sprint_3/Sprint_3_Burndown_Chart/Sprint_3_Burndown_Chart.png)

  </details>

---


- **Sprint Notları:**
   * Bu son sprint, PostureGuard projesinin tüm geliştirme süreçlerini tamamlayarak ürünü teslimata hazır hale getirmeye odaklandı. 
   * Sprint'in ana hedefleri; canlı analiz, yapay zeka ve 3B modelleme gibi temel özellikleri mükemmelleştirmek, platformun web ve mobil versiyonlarını tamamlamak ve stabil bir şekilde canlıya almaktı.
   * Görev takibi, sprint planlaması ve proje yönetimi için _`Notion`_ aracı kullanılmmıştır.
   * Günlük scrum toplantıları ve diğer ekip görüşmeleri, takımın müsaitlik durumuna göre _`Google Meet`_ ve _`Whatsapp`_   üzerinden gerçekleştirildi.
   * Kullanıcıya daha etkili görsel geri bildirim sağlamak amacıyla _`Blender`_ ile hazırlanan 3B modellerin, web arayüzünde _`Three.js`_ kütüphanesi kullanılarak dinamik olarak render edilmesi sağlandı.
   Kullanıcı sorularına akıllı yanıtlar verebilmek için, _`Gemini 1.5`_ Flash modeli ve embedding teknikleri temel alınarak bir _`RAG`_ (Retrieval-Augmented Generation) mimarisi kuruldu ve _`Gemini API`_ üzerinden entegre edildi.
   * Kullanıcılara tek tıkla ve güvenli bir giriş deneyimi sunmak amacıyla Google ile Giriş _`(Google OAuth 2.0)`_ entegrasyonu başarıyla tamamlandı.
 
- **Sprint İçinde Tamamlanması Beklenen Puan:**
  * `158`

- **Puan Tamamlama Mantığı:**
  * Toplamda `400` puanlık bir hedef belirlendi. Birinci sprintte `100`, ikinci sprintte `150` puanlık hedefler başarıyla tamamlanmıştır. Üçüncü sprint için başlangıçta, web platformunun canlı analiz, yapay zeka ve 3B modelleme gibi kritik özelliklerini tamamlamaya yönelik `150` puanlık bir hedef belirlenmişti. Ancak, sprint esnasında alınan stratejik bir kararla, başlangıçta planlanmayan mobil uygulama geliştirme çalışmaları da kapsama dahil edilmiştir. Bu önemli ekleme, sprintin iş yükünü ve projenin nihai değerini doğal olarak artırmış, bu nedenle sprintin puan hedefi `150`'den `158`'e güncellenmiştir. Bu nihai `158` puan, projenin sadece başlangıç hedeflerini tamamlamakla kalmayıp, mobil uygulama ile kapsamını genişleterek ulaştığı olgunluk seviyesinin ve başarısının bir göstergesidir.
  
  
  **Daily Scrum:** [Sprint 3 Daily Scrum](https://github.com/gulbahar-donmez/Team-116/tree/master/Project_Management_Files/Sprint_3/Sprint_3_Daily_Scrum)

- **Sprint Gözden Geçirilmesi:**
   * Oturum boyunca duruş skorunu gösteren gerçek zamanlı bir grafik başarıyla eklendi. Tamamlanan canlı analiz oturumları için detaylı PDF raporu oluşturan sistem geliştirildi.
   * Duruş bozukluğu (bad_posture) ve düzelme (good_posture) durumlarında WebSocket üzerinden anlık görsel ve işitsel (ses seviyesi ayarlanabilir) bildirimler gönderen sistem hayata geçirildi.
   * Canlı analiz sırasında ve PDF raporlarında gösterilecek AI tabanlı kişiselleştirilmiş öneriler geliştirildi. Chatbot arayüzü (ChatbotWidget.js) modernize edildi ve sesli komutla mesaj gönderme (Speech-to-Text) fonksiyonu eklendi.
   * App.js ve LoginPage.js dosyaları üzerinde yapılan çalışmalarla Google OAuth 2.0 entegrasyonu tamamlandı. 
   * React Native ile geliştirilecek mobil uygulama, web platformundaki tüm özelliklerle birlikte başarıyla tamamlanması ve teslim edilmesi için gerekli temeller atılmıştır.
   * Analiz sonuçları sayfasında 3B insan modeli entegrasyonu ve risk faktörlerine göre model üzerinde dinamik renklendirme (kırmızı/sarı/yeşil) başarıyla gerçekleştirildi. 
   * react-nice-avatar ile kişiselleştirilebilir avatar sistemi tamamlandı.
   * API güvenliği için hız sınırlama (Rate Limiting) mekanizması eklendi. 
   * JWT token yönetimi ve yetkisiz erişim denemelerine karşı güvenlik testleri yapıldı.
   * Production ortamı için Docker desteği (Dockerfile, docker-compose.yml), environment yönetimi (.env dosyaları) ve CORS yapılandırması tamamlandı. Sunucu port yönetimi ve reverse proxy (Nginx) planlaması yapıldı.
     

- **Sprint Gözden Geçirme Katılımcıları:**
    * `Beyza Boğuş, Gülbahar Dönmez, Onur Dağlar, Berhak Tanyıldızı`

- **Sprint Retrospektifi:**
   * Ekip, başlangıç hedeflerinin ötesine geçerek hem kapsamlı bir web platformu hem de tam fonksiyonlu bir mobil uygulamayı başarıyla teslim etmiştir. Karmaşık teknolojilerin (AI, 3D, Real-time Analysis) entegrasyonu sorunsuz bir şekilde tamamlanmıştır.
   * Projenin tamamlanması, tüm ekibin bir araya gelerek ürünün tanıtım videosunu izlediği bir toplantıyla kutlanmış; bu başarı, gelecekteki potansiyel adımlar üzerine yapılan bir fikir alışverişiyle taçlandırılmıştır.

</details>

---



</details>


![Endnotes](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/General_Documents/Github_Pages/EndNotes.png)




-----------------


<details>
  <summary><h2>İş Modeli Kanvası </h2></summary>

  ![İş Modeli Kanvası](https://github.com/gulbahar-donmez/Team-116/blob/master/Project_Management_Files/General_Documents/Yal%C4%B1n_Kanvas.png)  
  
</details>





<details>
  <summary><h2>Uygulama Renk Paleti </h2></summary>


| Color             | Hex                                                                              |
| ----------------- | -------------------------------------------------------------------------------- |
| Primary Color     | ![#7AB689](https://placehold.co/15x15/7AB689/7AB689.png) `#7AB689`                 |
| Light Color       | ![#AAD4AD](https://placehold.co/15x15/AAD4AD/AAD4AD.png) `#AAD4AD`                 |
| Lightest Color    | ![#F6FBF8](https://placehold.co/15x15/F6FBF8/F6FBF8.png) `#F6FBF8`                 |
| Dark Color        | ![#3EA232](https://placehold.co/15x15/3EA232/3EA232.png) `#3EA232`                 |
| Darkest Color     | ![#5F8185](https://placehold.co/15x15/5F8185/5F8185.png) `#5F8185`                 |


</details>



<details>
  <summary><h2>Kullanılan Teknolojiler </h2></summary>

  - [x] `Görüntü işleme`
  - [x] `MediaPipe`
  - [x] `OpenCV`
  - [x] `Google Gemini API`
  - [x] `PostgreSQL`
  - [x] `React.js`
  - [x] `HTML5/ CSS3`
  - [x] `Python`
  - [x] `JWT (JSON Web Tokens)`
  - [x] `Fernet`
  - [x] `Asana`
  - [X] `Notion`
  - [x] `Google Meet`
  - [X] `Blender`
  - [X] `C++`
  - [X] `RAG (Retrieval-Augmented Generation)`
</details>
