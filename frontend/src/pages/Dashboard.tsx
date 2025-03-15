import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<{ email: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [countries, setCountries] = useState<string[]>([]);
    const [selectedCountry, setSelectedCountry] = useState<string>("Allemagne");

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/");
            return;
        }

        axios.get(`${import.meta.env.VITE_API_USER_SERVICE}/me`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(response => {
            setUser(response.data);
        })
        .catch(() => {
            localStorage.removeItem("token");
            navigate("/");
        })
        .finally(() => {
            setLoading(false);
        });

    }, [navigate]);


const [deviceCount, setDeviceCount] = useState(0);
const [devices, setDevices] = useState<{ consumption: number; hours: number; }[]>([]);
const [totalConsumption, setTotalConsumption] = useState(0);
const [totalEmission, setTotalEmission] = useState(0);

const handleDeviceCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const count = parseInt(e.target.value) || 0;
    setDeviceCount(count);
    setDevices(Array.from({ length: count }, () => ({ consumption: 0, hours: 0 })));
  };

  const handleDeviceChange = (index: number, field: "consumption" | "hours", value: string) => {
    const newDevices = [...devices];
    newDevices[index] = {
      ...newDevices[index],
      [field]: parseFloat(value) || 0, // Assure que la valeur est un nombre
    };
    setDevices(newDevices);
  };
  
  const calculateConsumption = () => {
    const daysInYear = 365; 
    const total = devices.reduce((sum, device) => {
        const dailyConsumption = device.consumption * device.hours; 
        return sum + dailyConsumption * daysInYear; 
    }, 0);
    setTotalConsumption(parseFloat((total / 1000).toFixed(2)));
    if (selectedCountry) {
        axios.get(`http://localhost:3000/countries/${selectedCountry}`)
            .then(response => {
                const emissionFactor = parseFloat(response.data);
                const emission = totalConsumption * emissionFactor;
                setTotalEmission(parseFloat(emission.toFixed(2)));
            })
            .catch(error => {
                console.error("Erreur lors de la récupération de l'empreinte carbone du pays:", error);
            });
    }
    else{
        console.error("Veuillez sélectionner un pays");
    }
  };
  
  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCountry(e.target.value);
};

useEffect(() => {
    axios.get("http://localhost:3000/countries")
        .then(response => {
            const countriesList = response.data.split("\n").map((country: string) => country.trim());
            setCountries(countriesList);
        })
        .catch(error => {
            console.error("Erreur lors de la récupération des pays:", error);
        });
}, []);

    if (loading) {
        return <p className="has-text-centered">Chargement...</p>;
    }

    return (
        <div className="container mt-5">
            <div className="box">
                <h1 className="title has-text-centered">Bienvenue sur votre tableau de bord</h1>

                <div className="p-6 max-w-lg mx-auto bg-white rounded-xl shadow-md space-y-4">
      <h1 className="text-xl font-bold text-center">Calcul de Consommation d'Appareils</h1>
      <label className="block">Sélectionnez votre pays</label>
      <select 
                        className="w-full p-2 border rounded" 
                        value={selectedCountry} 
                        onChange={handleCountryChange}
                    >
                        {countries.map((country, index) => (
                            <option key={index} value={country}>
                                {country}
                            </option>
                        ))}
                    </select>

      <label className="block mt-2">Combien d'appareils utilisez-vous par jour ?</label>
      <input 
        type="number" 
        className="w-full p-2 border rounded" 
        min="1" 
        value={deviceCount} 
        onChange={handleDeviceCountChange} 
      />

      <div className="space-y-4">
        {devices.map((_, index) => (
          <div key={index} className="p-4 border rounded">
            <h3 className="font-semibold">Appareil {index + 1}</h3>
            <label>Consommation (en Wh)</label>
            <input 
              type="number" 
              className="w-full p-2 border rounded" 
              onChange={(e) => handleDeviceChange(index, "consumption", e.target.value)}
            />
            <label>Temps allumé (en heure/jour)</label>
            <input 
              type="number" 
              className="w-full p-2 border rounded" 
              onChange={(e) => handleDeviceChange(index, "hours", e.target.value)}
            />
          </div>
        ))}
      </div>

      {deviceCount > 0 && (
        <button 
          className="button is-danger is-fullwidth mt-4" 
          onClick={calculateConsumption}
        >
          Calculer la consommation totale
        </button>
      )}

      <h2 className="text-lg font-semibold">Consommation sur l'année : {totalConsumption} kWh</h2>
      <h3 className="text-md">Empreinte des appareils sur l'année : {totalEmission} g CO₂ eq</h3>
    </div>

                
                {user && (
                    <p className="has-text-centered mt-3">Connecté en tant que : <strong>{user.email}</strong></p>
                )}

                <button className="button is-danger is-fullwidth mt-4" onClick={() => {
                    localStorage.removeItem("token");
                    navigate("/");
                }}>
                    Se déconnecter
                </button>
            </div>
        </div>
    );
};

export default Dashboard;
