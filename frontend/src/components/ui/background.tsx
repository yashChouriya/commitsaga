'use client';

export function MeshBackground() {
  return (
    <div className="fixed inset-0 -z-10 bg-mesh">
      {/* Animated Blobs */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-violet-500/30 rounded-full filter blur-[120px] animate-blob" />
      <div className="absolute top-60 -right-40 w-96 h-96 bg-cyan-500/20 rounded-full filter blur-[120px] animate-blob animation-delay-2000" />
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-purple-500/20 rounded-full filter blur-[120px] animate-blob animation-delay-4000" />

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
}

export function AuthBackground() {
  return (
    <div className="fixed inset-0 -z-10 bg-[#0a0a0f]">
      {/* Large gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-violet-600/20 rounded-full filter blur-[150px] animate-blob" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-500/15 rounded-full filter blur-[130px] animate-blob animation-delay-2000" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full filter blur-[180px] animate-blob animation-delay-4000" />

      {/* Subtle radial gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a0a0f]/80" />
    </div>
  );
}
