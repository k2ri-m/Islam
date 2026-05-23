export default function Home() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      fontFamily: 'sans-serif',
      backgroundColor: '#0f172a',
      color: '#f1f5f9'
    }}>
      <h1 style={{ color: '#fbbf24' }}>نور الإسلام</h1>
      <p>جاري الانتقال للبوابة...</p>
      <script 
        dangerouslySetInnerHTML={{ 
          __html: `window.location.replace('/project-folder/index.html');` 
        }} 
      />
    </div>
  );
}
