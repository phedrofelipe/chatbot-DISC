import { useState } from 'react';
import { motion } from 'framer-motion';

interface AccessCodeScreenProps {
  email: string;
  accessCode: string;
  onContinue: () => void;
}

export function AccessCodeScreen({ email, accessCode, onContinue }: AccessCodeScreenProps) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  // navigator.clipboard só existe em contexto seguro (HTTPS ou localhost) —
  // em acesso via IP de rede local por HTTP puro, cai no fallback abaixo.
  const copyWithFallback = (text: string): boolean => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    document.body.removeChild(textarea);
    return ok;
  };

  const handleCopy = async () => {
    setCopyFailed(false);
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(accessCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      }
    } catch {
      // segue para o fallback abaixo
    }

    if (copyWithFallback(accessCode)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setCopyFailed(true);
    }
  };

  return (
    <motion.div
      className="auth"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <div className="auth-card">
        <h2>Guarde seu código de acesso</h2>
        <p>
          Use o e-mail <strong>{email}</strong> junto com o código abaixo para consultar seu
          resultado depois, caso saia ou troque de dispositivo. Ele <strong>não será mostrado
          novamente</strong> — anote ou copie agora.
        </p>
        <div
          style={{
            fontSize: '28px',
            fontWeight: 700,
            letterSpacing: '2px',
            textAlign: 'center',
            padding: '16px',
            margin: '16px 0',
            borderRadius: '8px',
            background: 'var(--surface2)',
            color: 'var(--text)',
          }}
        >
          {accessCode}
        </div>
        {copyFailed && (
          <p className="admin-error">
            Não foi possível copiar automaticamente. Selecione o código acima e copie manualmente
            (Ctrl+C).
          </p>
        )}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button className="btn-restart" style={{ flex: 1 }} onClick={handleCopy}>
            {copied ? 'Copiado!' : '📋 Copiar código'}
          </button>
          <button className="btn-auth" style={{ flex: 1 }} onClick={onContinue}>
            Já guardei, continuar →
          </button>
        </div>
      </div>
    </motion.div>
  );
}
