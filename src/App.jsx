import { AllRoutes } from './routes/AllRoutes';
import { Header } from './components';

function App() {
  return (
    <div className="App dark:bg-dark">
      <Header />
      <AllRoutes />
    </div>
  );
}

export default App;