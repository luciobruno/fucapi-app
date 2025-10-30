import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const formatDateAgo = (timestamp: number): string => {
  if (!timestamp) {
    return "";
  }
  return formatDistanceToNow(new Date(timestamp), {
    addSuffix: true,
    locale: ptBR,
  });
};