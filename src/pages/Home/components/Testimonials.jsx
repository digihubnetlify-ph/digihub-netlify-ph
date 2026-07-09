export const Testimonials = () => {
  return (
    <section className='my-20'>
        <h1 className="text-2xl text-center font-semibold dark:text-slate-100 mb-5 underline underline-offset-8">What Our Viewers Say</h1>    
        <div className="grid mb-8 rounded-lg border border-gray-200 shadow-sm dark:border-gray-700 md:mb-12 md:grid-cols-2">
            <figure className="flex flex-col justify-center items-center p-8 text-center bg-white rounded-t-lg border-b border-gray-200 md:rounded-t-none md:rounded-tl-lg md:border-r dark:bg-gray-800 dark:border-gray-700">
                <blockquote className="mx-auto mb-4 max-w-2xl text-gray-500 lg:mb-8 dark:text-gray-400">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">My favorite movie web app!</h3>
                    <p className="my-4 font-light">I love how easy it is to find and buy content on DigiHub. The collection is good and the prices are very affordable!</p>
                </blockquote>
                <figcaption className="flex justify-center items-center space-x-3">
                    <img className="w-9 h-9 rounded-full" src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=120&q=50" alt="user" />
                    <div className="space-y-0.5 font-medium dark:text-white text-left">
                        <div>James Ploy</div>
                        <div className="text-sm font-light text-gray-500 dark:text-gray-400">Regular Customer</div>
                    </div>
                </figcaption>    
            </figure>
            <figure className="flex flex-col justify-center items-center p-8 text-center bg-white rounded-tr-lg border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                <blockquote className="mx-auto mb-4 max-w-2xl text-gray-500 lg:mb-8 dark:text-gray-400">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Perfect for movie nights!</h3>
                    <p className="my-4 font-light">Me and my family use DigiHub every weekend. So many great titles to choose from. Highly recommended!</p>
                </blockquote>
                <figcaption className="flex justify-center items-center space-x-3">
                    <img className="w-9 h-9 rounded-full" src="https://images.unsplash.com/photo-1525085475165-c6808cdb005e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=120&q=50" alt="user" />
                    <div className="space-y-0.5 font-medium dark:text-white text-left">
                        <div>Sarah Santos</div>
                        <div className="text-sm font-light text-gray-500 dark:text-gray-400">Stay-at-home Mom</div>
                    </div>
                </figcaption>    
            </figure>
            <figure className="flex flex-col justify-center items-center p-8 text-center bg-white rounded-bl-lg border-b border-gray-200 md:border-b-0 md:border-r dark:bg-gray-800 dark:border-gray-700">
                <blockquote className="mx-auto mb-4 max-w-2xl text-gray-500 lg:mb-8 dark:text-gray-400">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Great value for money!</h3>
                    <p className="my-4 font-light">I don't need to pay monthly fees anymore. With DigiHub I just buy what I want. Saves me a lot of money!</p>
                </blockquote>
                <figcaption className="flex justify-center items-center space-x-3">
                    <img className="w-9 h-9 rounded-full" src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=120&q=60" alt="user" />
                    <div className="space-y-0.5 font-medium dark:text-white text-left">
                        <div>Marco Rivera</div>
                        <div className="text-sm font-light text-gray-500 dark:text-gray-400">College Student</div>
                    </div>
                </figcaption>    
            </figure>
            <figure className="flex flex-col justify-center items-center p-8 text-center bg-white rounded-b-lg border-gray-200 md:rounded-br-lg dark:bg-gray-800 dark:border-gray-700">
                <blockquote className="mx-auto mb-4 max-w-2xl text-gray-500 lg:mb-8 dark:text-gray-400">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Always up to date!</h3>
                    <p className="my-4 font-light">DigiHub always has the latest content available. I never miss a new release anymore. Best digital platform out there!</p>
                </blockquote>
                <figcaption className="flex justify-center items-center space-x-3">
                    <img className="w-9 h-9 rounded-full" src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=120&q=60" alt="user" />
                    <div className="space-y-0.5 font-medium dark:text-white text-left">
                        <div>Lisa Talor</div>
                        <div className="text-sm font-light text-gray-500 dark:text-gray-400">Office Worker</div>
                    </div>
                </figcaption>    
            </figure>
        </div>
    </section>
  )
}
