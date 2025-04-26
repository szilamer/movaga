export default function Hero() {
  return (
    <section
      className="relative bg-cover bg-center h-[600px]"
      style={{ backgroundImage: "url('https://placekitten.com/1600/600')" }}
    >
      <div className="container mx-auto h-full flex flex-col justify-center items-start text-white">
        <h1 className="text-6xl font-bold mb-4">Fedezd fel a Movaga kínálatát!</h1>
        <p className="text-xl mb-8">Minőségi termékek, verhetetlen árak.</p>
        <a
          href="/products"
          className="px-6 py-3 bg-gold text-black rounded-lg hover:bg-gold/90"
        >
          Vásárlás
        </a>
      </div>
    </section>
  )
} 
