import { Accordion } from "./Accordion";

export const Faq = () => {
    const faqs = [
        { "id": 1, "question": "Why should I use DigiHub?", "answer": "DigiHub gives you access to the latest movies, music, videos, and more — all in one place. No subscriptions needed — just pay for what you want. Browse our growing collection and enjoy digital content at unbeatable prices!" },
        { "id": 2, "question": "Can I access my purchases on mobile and other devices?", "answer": "Yes! DigiHub works on all your devices — smartphones, tablets, laptops, and smart TVs. Simply log in to your account and your purchased content will be available anytime, anywhere." },
        { "id": 3, "question": "How do I purchase content on DigiHub?", "answer": "Purchasing is super easy! Simply browse our collection, click on the item you want, add it to your cart, and proceed to checkout. We support GCash, Maya, and QRPh. Once payment is confirmed, it's yours!" },
        { "id": 4, "question": "Do you support online payments?", "answer": "Yes! DigiHub supports multiple secure payment methods including GCash, Maya, QRPh, and other major online payment platforms available in the Philippines." }
    ];
    
  return (
    <section className="my-10 p-7 border rounded dark:border-slate-700 shadow-sm">        
      <h1 className="text-2xl text-center font-semibold text-red-600 dark:text-red-400 mb-3 underline underline-offset-8">Frequently Asked Question</h1>    
            <div className="" id="accordion-flush" data-accordion="collapse" data-active-classes="bg-white dark:bg-gray-900 text-gray-900 dark:text-white" data-inactive-classes="text-gray-500 dark:text-gray-400">
              { faqs.map((faq) => (
                <Accordion key={faq.id} faq={faq} /> 
              )) }
            </div>
      </section>
  )
}
