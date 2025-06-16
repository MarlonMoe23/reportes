// pages/api/reportes/[id].js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'PUT') {
    const { fecha_reporte, tecnico, planta, equipo, reporte, tiempo, terminado } = req.body;

    const { error } = await supabase
      .from('reportes')
      .update({
        fecha_reporte,
        tecnico,
        planta,
        equipo,
        reporte,
        tiempo,
        terminado,
      })
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: 'Error al actualizar reporte', detalle: error.message });
    }

    return res.status(200).json({ mensaje: 'Reporte actualizado' });
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase
      .from('reportes')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: 'Error al eliminar reporte', detalle: error.message });
    }

    return res.status(200).json({ mensaje: 'Reporte eliminado' });
  }

  res.setHeader('Allow', ['PUT', 'DELETE']);
  res.status(405).end(`Método ${req.method} no permitido`);
}