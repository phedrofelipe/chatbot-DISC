import { motion } from 'framer-motion';

interface IntroScreenProps {
  onStart: () => void;
}

export function IntroScreen({ onStart }: IntroScreenProps) {
  return (
    <motion.div
      className="intro"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="badge">🧠 Baseado em William Moulton Marston · 1928</div>
      <h1>
        Descubra seu
        <br />
        <em>perfil comportamental</em>
      </h1>
      <p>
        10 perguntas de múltipla escolha para identificar seu tipo DISC dominante e secundário, com
        análise de pontos fortes, desafios e dicas de gestão.
      </p>
      <div className="disc-preview">
        <span className="disc-pill D">D · Executor</span>
        <span className="disc-pill I">I · Comunicador</span>
        <span className="disc-pill S">S · Planejador</span>
        <span className="disc-pill C">C · Analista</span>
      </div>
      <button className="btn-start" onClick={onStart}>
        Começar agora →
      </button>
    </motion.div>
  );
}
