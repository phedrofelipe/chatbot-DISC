interface LoadingScreenProps {
  message: string;
}

export function LoadingScreen({ message }: LoadingScreenProps) {
  return (
    <div className="loading">
      <div className="loading-orb"></div>
      <h3>{message}</h3>
      <p>
        A IA está processando suas respostas e gerando um relatório personalizado com base no modelo
        DISC de Marston.
      </p>
    </div>
  );
}
