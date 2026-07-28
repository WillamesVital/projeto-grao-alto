import Image from "next/image";

const BRAND_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAsKgGIj1yCJhK1AKH8sV4ntTRwe93gNW6jV_v9JAqjmCugPi4c8TYPKlswQEilzrqMJXXJ0fUH6ObMPkWTlIDQ8K7wJG2Vx-VvaWxLItd9o7MEhmUbxvs4jXG0sUMbN68QkcTT2nOO-hLl6zgtOKkiLbNCOK44UmGL8JgWYthAf1-dbBJTZnMW0XHNDT6jo5Z8uyE1Q0GU-rFAglX9zwOi4Nhk5qMoOAOhXoh7UFF3eAWs55VKt9IPNQ";

export default function AuthShell({
  brandTitle,
  brandBody,
  children,
}: {
  brandTitle: string;
  brandBody: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid w-full max-w-[1100px] grid-cols-1 overflow-hidden rounded-xl bg-white shadow-md md:grid-cols-2">
      <div className="relative hidden min-h-[600px] md:block">
        <Image src={BRAND_IMAGE} alt="" fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-coffee-roast/60 to-transparent" />
        <div className="absolute right-12 bottom-12 left-12 z-20 text-white">
          <h2 className="font-display mb-4 text-headline-lg">{brandTitle}</h2>
          <p className="leading-relaxed text-body-lg opacity-90">{brandBody}</p>
        </div>
      </div>
      <div className="flex flex-col justify-center p-8 md:p-12 lg:p-16">{children}</div>
    </section>
  );
}
