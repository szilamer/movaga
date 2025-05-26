export default function FooterSection() {
  return (
    <footer className="bg-black text-white py-6">
      <div className="container mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-sm">© {new Date().getFullYear()} Movaga. Minden jog fenntartva.</p>
        <div className="space-x-4">
          <a href="/adatvedelem" className="text-gold hover:underline">Adatvédelem</a>
          <a href="/aszf" className="text-gold hover:underline">ÁSZF</a>
        </div>
      </div>
    </footer>
  )
} 
