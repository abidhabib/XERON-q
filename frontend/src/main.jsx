import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { UserProvider } from './UserContext/UserContext'

ReactDOM.createRoot(document.getElementById('root')).render(
    <UserProvider>
           

    <App />
 
    </UserProvider>
)
