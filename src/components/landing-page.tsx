export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-gray-900 to-black">
      <h1 className="text-5xl font-bold mb-4 text-gold">Üdvözöl a Movaga</h1>
      <p className="text-lg text-gray-400 mb-6">Vásárolj és kezelj mindent egy helyen.</p>
      <a href="/auth/login" className="px-6 py-3 bg-gold text-black rounded-lg hover:bg-gold/90">Bejelentkezés</a>
    </div>
  )
} 
