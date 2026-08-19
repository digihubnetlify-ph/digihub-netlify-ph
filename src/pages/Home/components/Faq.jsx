import { Accordion } from "./Accordion";

export const Faq = () => {
    const faqs = [
        { "id": 1, "question": "Bakit ko dapat gamitin ang DigiHub?", "answer": "Sa DigiHub, makukuha mo ang pinakabagong movies, music, videos, at marami pang iba — lahat nasa iisang lugar lang. Walang subscription na kailangan — babayaran mo lang yung gusto mo. I-browse na ang paparami pang collection namin at mag-enjoy sa digital content sa presyong hindi mo aabutan kahit saan!" },
        { "id": 2, "question": "Pwede ko bang ma-access ang mga binili ko sa mobile at ibang device?", "answer": "Oo naman! Gumagana ang DigiHub sa lahat ng device mo — smartphones, tablets, laptops, at smart TVs. Mag-login ka lang sa account mo, andun na agad yung mga binili mo anytime, anywhere." },
        { "id": 3, "question": "Paano bumili ng content sa DigiHub?", "answer": "Super dali lang! I-browse mo yung collection namin, i-click yung item na gusto mo, idagdag sa cart, tapos mag-checkout na. Tumatanggap kami ng GCash, Maya, at QRPh. Once na-confirm na ang bayad, sayo na yun!" },
        { "id": 4, "question": "May online payments ba kayo?", "answer": "Oo! Sinusuportahan ng DigiHub ang maraming secure na payment methods gaya ng GCash, Maya, QRPh, at iba pang major online payment platforms na available sa Pilipinas." }
    ];
    
  return (
    <section className="my-10 p-7 border rounded dark:border-slate-700 shadow-sm">        
      <h1 className="text-2xl text-center font-semibold text-orange-600 dark:text-orange-500 mb-3 underline underline-offset-8">Frequently Ask Question:</h1>    
            <div className="" id="accordion-flush" data-accordion="collapse" data-active-classes="bg-white dark:bg-gray-900 text-gray-900 dark:text-white" data-inactive-classes="text-gray-500 dark:text-gray-400">
              { faqs.map((faq) => (
                <Accordion key={faq.id} faq={faq} /> 
              )) }
            </div>
      </section>
  )
}
