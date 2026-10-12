import type en from "./en"

type Translation = typeof en

const id: Translation = {
  common: {
    cancel: "Batal",
    save: "Simpan",
    error: "Error",
    failed: "Gagal",
  },
  profile: {
    title: "Profil",
    accounts: "Akun",
    addAccount: "Tambah akun",
    preferences: "Preferensi",
    settings: "Pengaturan",
    language: "Bahasa",
    currency: "Mata uang",
    biometricLock: "Kunci biometrik",
    signOut: "Keluar",
  },
  language: {
    pickerTitle: "Pilih bahasa",
    updateFailed: "Tidak dapat mengganti bahasa.",
  },
}

export default id