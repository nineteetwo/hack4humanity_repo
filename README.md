# Dolphy Local Setup Guide (PostgreSQL & Python)

Bu rehber, projeyi kendi bilgisayarında yerel (local) olarak çalıştırmak isteyenler için hazırlanmıştır. Proje arka planda **Python (FastAPI)** ve veritabanı olarak **PostgreSQL** kullanmaktadır.

## Ön Gereksinimler
Sisteminize aşağıdaki araçların yüklü olduğundan emin olun:
- **Python** (3.9 veya daha yeni bir sürüm)
- **Docker Desktop** (Veritabanını kolayca ayağa kaldırmak için)
- **Git** (Projeyi klonlamak için)

---

## 1. PostgreSQL Veritabanını Docker ile Ayağa Kaldırmak

Veritabanını bilgisayarınıza kurmak yerine Docker ile tek bir komutta çalıştırabilirsiniz. Terminali (veya Komut İstemini) açın ve şu komutu yapıştırın:

```bash
docker run --name dolphy_db \
  -e POSTGRES_USER=dolphy \
  -e POSTGRES_PASSWORD=dolphy \
  -e POSTGRES_DB=dolphy \
  -p 5432:5432 \
  -d postgres:15
```

Bu komut:
- `dolphy_db` adında bir arka plan hizmeti başlatır.
- Kullanıcı adı, şifre ve veritabanı adını `dolphy` olarak ayarlar.
- Bilgisayarınızın `5432` portunu veritabanına bağlar.

> [!TIP]
> Docker konteyneri durursa tekrar başlatmak için `docker start dolphy_db` komutunu kullanabilirsiniz. Sıfırlamak isterseniz `docker rm -f dolphy_db` yapıp üstteki komutu tekrar çalıştırın.

---

## 2. Python Kütüphanelerini Kurmak

Projeyi indirdiğiniz klasöre (örneğin `hack4humanity_repo-main`) terminal üzerinden gidin ve sırasıyla şu adımları izleyin:

**A. Sanal Ortam (Virtual Environment) Oluşturun**
Bağımlılıkların sisteminize karışmaması için proje klasöründe bir sanal ortam oluşturun:
```bash
# Windows için:
python -m venv venv

# Mac/Linux için:
python3 -m venv venv
```

**B. Sanal Ortamı Aktif Edin**
```bash
# Windows (Command Prompt):
venv\Scripts\activate.bat

# Windows (PowerShell):
venv\Scripts\Activate.ps1

# Mac/Linux:
source venv/bin/activate
```
*(Aktif ettiğinizde komut satırının başında `(venv)` ibaresini göreceksiniz).*

**C. Gerekli Kütüphaneleri Yükleyin**
Projenin ihtiyaç duyduğu tüm Python paketlerini kurun:
```bash
pip install -r requirements.txt
```

---

## 3. Ayar Dosyasını (Environment Variables) Hazırlamak

Proje kök dizininde (içinde `app` klasörü olan yer) yeni bir dosya oluşturun ve adını **`.env`** koyun. İçerisine şu satırı ekleyin:

```env
DATABASE_URL=postgresql://dolphy:dolphy@localhost:5432/dolphy
```

Bu ayar, Python sunucusunun az önce Docker ile başlattığımız veritabanına bağlanmasını sağlar.

---

## 4. Projeyi Çalıştırmak

Her şey hazır! Şimdi FastAPI sunucusunu ayağa kaldırıyoruz. Terminalde (sanal ortam aktifken) şu komutu çalıştırın:

```bash
uvicorn app.main:app --reload
```

> [!NOTE]
> Sunucu başladığında `http://127.0.0.1:8000` adresinde yerel olarak çalışacaktır. Eğer tarayıcınız otomatik açılmazsa, kendiniz adres çubuğuna bu linki yapıştırarak siteye giriş yapabilirsiniz.

**Tebrikler!** Sistem başarıyla çalışıyor olmalı. Herhangi bir kod değişikliği yaptığınızda `--reload` sayesinde sunucu kendini otomatik olarak güncelleyecektir.
