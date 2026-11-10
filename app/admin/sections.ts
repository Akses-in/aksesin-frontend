export const adminSections = [
  {
    slug: "peta",
    title: "Peta",
    description: "Tinjau lokasi aksesibilitas dan periksa apakah informasinya valid.",
    next: "Daftar lokasi dan keputusan validasi akan tersedia setelah data peta terhubung.",
  },
  {
    slug: "pengguna",
    title: "Pengguna",
    description: "Tinjau akun yang terdaftar di Aksesin.",
    next: "Daftar pengguna akan tersedia setelah modul pengelolaan akun terhubung.",
  },
  {
    slug: "komunitas",
    title: "Komunitas",
    description: "Kelola komunitas yang tersedia di Aksesin.",
    next: "Daftar komunitas akan tersedia setelah data komunitas terhubung.",
  },
  {
    slug: "postingan",
    title: "Postingan",
    description: "Tinjau dan moderasi konten yang dibagikan di komunitas.",
    next: "Daftar postingan dan tindakan moderasi akan tersedia setelah data konten terhubung.",
  },
] as const;

export type AdminSection = (typeof adminSections)[number];
