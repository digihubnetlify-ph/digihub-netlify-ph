import { Accordion } from "./Accordion";

export const Faq = () => {
    const faqs = [
        {
          "id": 1,
          "question": "Why should I use DigitalMovies?",
          "answer": "DigitalMovies gives you access to the latest blockbusters, indie films, and exclusive titles all in one place. No subscriptions needed — just pay for what you want to watch. Browse our growing collection and enjoy movies at unbeatable prices!"
        },
        {
          "id": 2,
          "question": "Can I access my movies on mobile and other devices?",
          "answer": "Yes! DigitalMovies works on all your devices — smartphones, tablets, laptops, and smart TVs. Simply log in to your account and your purchased movies will be available anytime, anywhere."
        },
        {
          "id": 3,
          "question": "How do I purchase a movie on DigitalMovies?",
          "answer": "Purchasing is super easy! Simply browse our collection, click on the movie you want, add it to your cart, and proceed to checkout. We support multiple payment methods including credit/debit cards, GCash, and Maya. Once payment is confirmed, the movie is yours!"
        },
        {
          "id": 4,
          "question": "Do you support online payments?",
          "answer": "Yes! We support multiple secure payment methods including credit/debit cards, GCash, Maya, and other major online payment platforms available in the Philippines."
        }
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
