function Barber() {
  return (
    <div style={{ 
      backgroundColor: '#121212', 
      color: '#D4AF37', 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center', 
      alignItems: 'center',
      fontFamily: 'sans-serif'
    }}>
      <h1 style={{ fontSize: '3rem', fontWeight: 'bold', letterSpacing: '2px' }}>
        BARBEARIA ELITE
      </h1>
      <p style={{ color: '#E5E5E5', marginTop: '10px' }}>
        Onde o estilo encontra a tradição.
      </p>
      <button style={{ 
        marginTop: '30px', 
        padding: '12px 24px', 
        backgroundColor: '#D4AF37', 
        color: '#000', 
        border: 'none', 
        fontWeight: 'bold',
        cursor: 'pointer',
        textTransform: 'uppercase'
      }}>
        Agendar Horário
      </button>
    </div>
  )
}

export default Barber