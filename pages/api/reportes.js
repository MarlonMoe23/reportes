// pages/api/reportes.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { fecha_reporte, tecnico, planta, equipo, reporte, tiempo, terminado } = req.body;

    const { error } = await supabase.from('reportes').insert([
      {
        fecha_reporte: fecha_reporte || new Date().toISOString(),
        tecnico,
        planta,
        equipo,
        reporte,
        tiempo,
        terminado,
      },
    ]);

    if (error) {
      return res.status(500).json({ error: 'Error al guardar reporte', detalle: error.message });
    }

    return res.status(201).json({ mensaje: 'Reporte guardado' });
  }

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('reportes')
      .select('*')
      .order('fecha_reporte', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Error al obtener reportes', detalle: error.message });
    }

    return res.status(200).json(data);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Método ${req.method} no permitido`);
}