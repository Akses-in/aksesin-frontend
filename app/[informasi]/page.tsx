import Link from "next/link";
import { notFound } from "next/navigation";
import { Site } from "../_components/site";

const information = {
  bantuan: {
    title: "Pusat bantuan",
    text: "Jika kode WhatsApp belum masuk, periksa nomor yang kamu gunakan dan minta kode baru. Jika kamu mendaftar lewat email, periksa juga folder spam. Setelah verifikasi, kamu bisa masuk dan melewati preferensi aksesibilitas.",
  },
  privasi: {
    title: "Kebijakan Privasi",
    text: "Nama dan nomor WhatsApp atau email digunakan untuk membuat akun. Status disabilitas dan preferensi aksesibilitas bersifat opsional. Kamu dapat melihat, mengubah, atau menghapus isian tersebut dari ringkasan akun dan halaman preferensi.",
  },
  ketentuan: {
    title: "Ketentuan Penggunaan",
    text: "Gunakan nomor WhatsApp atau alamat email yang dapat kamu akses untuk memverifikasi akun. Jaga kerahasiaan password dan gunakan menu Keluar saat selesai memakai perangkat bersama.",
  },
} as const;

export function generateStaticParams() {
  return Object.keys(information).map((informasi) => ({ informasi }));
}

export default async function InformationPage({ params }: PageProps<"/[informasi]">) {
  const { informasi } = await params;
  if (!Object.hasOwn(information, informasi)) notFound();
  const { title, text } = information[informasi as keyof typeof information];

  return (
    <Site>
      <main id="konten" className="narrow-main" tabIndex={-1}>
        <section className="panel page-stack">
          <div className="page-heading"><h1>{title}</h1><p>{text}</p></div>
          <Link className="button secondary" href="/">Kembali ke Aksesin</Link>
        </section>
      </main>
    </Site>
  );
}
