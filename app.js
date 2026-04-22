import React, { useState, useEffect } from 'react';

// Replace with your Render URL after deployment
const API_BASE = "https://your-app.onrender.com/api"; 

const App = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Fetch classes from your Square-linked Backend
  useEffect(() => {
    fetch(`${API_BASE}/classes`)
      .then(res => res.json())
      .then(data => {
        setClasses(data);
        setLoading(false);
      })
      .catch(err => console.error("Error fetching classes:", err));
  }, []);

  const handleBooking = async (classItem) => {
    // In a real app, you'd trigger the Square Payment Form here.
    // For now, we'll simulate the call to your server.js
    const payload = {
      serviceId: classItem.variationId,
      startAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      customerEmail: "client@example.com",
      customerName: "New Student",
      sourceId: "cnon:card-nonce-ok" // Mock token for testing
    };

    const response = await fetch(`${API_BASE}/book-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (result.success) {
      alert("Success! Check your Gmail for confirmation.");
    } else {
      alert("Booking failed. Check server logs.");
    }
  };

  if (loading) return <div className="p-20 text-center font-serif italic">Opening the space...</div>;

  return (
    <div className="min-h-screen bg-[#F9F8F6] p-8 md:p-16">
      <header className="max-w-4xl mx-auto mb-16 text-center">
        <h1 className="text-xs uppercase tracking-[.4em] text-gray-400 mb-4">PranaSpace Studio</h1>
        <h2 className="text-4xl md:text-5xl font-serif text-[#2D3436]">Reserve your Breath</h2>
      </header>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {classes.map((item) => (
          <div key={item.id} className="bg-white border border-gray-100 p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-2xl font-serif mb-2">{item.name}</h3>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">{item.description}</p>
            
            <div className="flex justify-between items-center mt-auto">
              <span className="text-xl font-medium text-[#4A6741]">${item.price}</span>
              <button 
                onClick={() => handleBooking(item)}
                className="bg-[#4A6741] text-white px-8 py-3 rounded-full hover:bg-[#3d5535] transition-colors uppercase text-xs tracking-widest font-bold"
              >
                Book Now
              </button>
            </div>
          </div>
        ))}
      </div>

      <footer className="mt-20 text-center text-gray-400 text-xs tracking-widest uppercase">
        &copy; 2026 PranaSpace • Powered by Square & Google
      </footer>
    </div>
  );
};

export default App;
