import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const AppContext = createContext(null);

const EMPRESA_ATIVA_STORAGE_KEY = 'df_empresa_ativa';

function lerEmpresaAtivaSalva() {
  if (typeof window === 'undefined') return null;

  try {
    return JSON.parse(window.localStorage.getItem(EMPRESA_ATIVA_STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
}

function salvarEmpresaAtiva(empresa) {
  if (typeof window === 'undefined') return;

  if (!empresa?.id) {
    window.localStorage.removeItem(EMPRESA_ATIVA_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(EMPRESA_ATIVA_STORAGE_KEY, JSON.stringify(empresa));
}

const TOAST_TITLES = {
  sucesso: 'Sucesso',
  success: 'Sucesso',
  erro: 'Atenção',
  error: 'Atenção',
  alerta: 'Atenção',
  warning: 'Atenção',
  info: 'Aviso'
};

function normalizarTipoToast(type) {
  if (type === 'success') return 'sucesso';
  if (type === 'error') return 'erro';
  if (type === 'warning') return 'alerta';
  return type || 'info';
}

export function AppProvider({ children }) {
  const [globalLoading, setGlobalLoading] = useState(false);
  const [empresaAtiva, setEmpresaAtivaState] = useState(() => lerEmpresaAtivaSalva());
  const [empresasDisponiveis, setEmpresasDisponiveis] = useState([]);
  const [toast, setToast] = useState(null);
  const timeoutRef = useRef(null);

  const setEmpresaAtiva = useCallback((empresa) => {
    const empresaNormalizada = empresa?.id
      ? {
          id: empresa.id,
          nome: empresa.nome || '',
          perfil: empresa.perfil || 'operador'
        }
      : null;

    setEmpresaAtivaState(empresaNormalizada);
    salvarEmpresaAtiva(empresaNormalizada);
  }, []);

  const limparEmpresaAtiva = useCallback(() => {
    setEmpresaAtivaState(null);
    salvarEmpresaAtiva(null);
  }, []);

  const hideToast = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setToast(null);
  }, []);

  const showToast = useCallback((message, type = 'info', options = {}) => {
    if (!message) return;

    const normalizedType = normalizarTipoToast(type);
    const duration = options.duration ?? 5200;

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    setToast({
      id: Date.now(),
      message: String(message),
      type: normalizedType,
      title: options.title || TOAST_TITLES[normalizedType] || 'Aviso'
    });

    timeoutRef.current = window.setTimeout(() => {
      setToast(null);
      timeoutRef.current = null;
    }, duration);
  }, []);

  const runWithLoading = useCallback(async (callback) => {
    setGlobalLoading(true);
    try {
      return await callback();
    } finally {
      setGlobalLoading(false);
    }
  }, []);

  const value = useMemo(() => ({
    globalLoading,
    setGlobalLoading,
    empresaAtiva,
    empresaId: empresaAtiva?.id || null,
    perfilEmpresaAtiva: empresaAtiva?.perfil || '',
    setEmpresaAtiva,
    limparEmpresaAtiva,
    empresasDisponiveis,
    setEmpresasDisponiveis,
    toast,
    showToast,
    hideToast,
    runWithLoading
  }), [globalLoading, empresaAtiva, empresasDisponiveis, toast, showToast, hideToast, runWithLoading, setEmpresaAtiva, limparEmpresaAtiva]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useApp deve ser usado dentro do AppProvider');
  }

  return context;
}
