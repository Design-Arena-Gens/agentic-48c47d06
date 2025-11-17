export default function VideoResult({ videoUrl }: { videoUrl: string | null }) {
  if (!videoUrl) {
    return (
      <div style={{
        width: '100%', height: '100%',
        display: 'grid', placeItems: 'center',
        color: '#6b7b8c'
      }}>
        Waiting for result...
      </div>
    );
  }
  return (
    <video className="video" controls src={videoUrl} playsInline />
  );
}
