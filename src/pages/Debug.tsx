const Debug = () => {
  // Log direto no carregamento
  console.log('🚀 DEBUG: Componente carregado!');
  console.log('🚀 DEBUG: window.location:', window.location.href);
  console.log('🚀 DEBUG: document.body:', document.body);
  
  return (
    <div>
      <h1 style={{ color: 'red', fontSize: '24px', padding: '20px' }}>
        🚀 TESTE ANDROID - FUNCIONOU!
      </h1>
      <p style={{ color: 'blue', fontSize: '18px', padding: '20px' }}>
        Se você está vendo isso, o React está OK!
      </p>
    </div>
  );
};

export default Debug;
