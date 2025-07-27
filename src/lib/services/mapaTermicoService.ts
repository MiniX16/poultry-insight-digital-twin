import { supabase } from "../supabase";
import type { Database } from "../database.types";

type MapaTermico = Database["public"]["Tables"]["mapa_termico"]["Row"];
type MapaTermicoInsert = Database["public"]["Tables"]["mapa_termico"]["Insert"];
type MapaTermicoUpdate = Database["public"]["Tables"]["mapa_termico"]["Update"];

export const mapaTermicoService = {
  async getAllMapas() {
    const { data, error } = await supabase
      .from("mapa_termico")
      .select("*")
      .order("fecha", { ascending: false });

    if (error) throw error;
    return data as MapaTermico[];
  },

  async getUltimoMapa() {
    const { data, error } = await supabase
      .from("mapa_termico")
      .select("*")
      .order("fecha", { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;
    return data as MapaTermico;
  },

  async getUltimoMapaPorLote(loteId: number) {
    const { data, error } = await supabase
      .from("mapa_termico")
      .select("*")
      .eq("lote_id", loteId)
      .order("fecha", { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;
    return data as MapaTermico;
  },

  async createMapaTermico(mapa: MapaTermicoInsert) {
    const { data, error } = await supabase
      .from("mapa_termico")
      .insert(mapa)
      .select()
      .single();

    if (error) throw error;
    return data as MapaTermico;
  },

  async updateMapaTermico(id: number, mapa: MapaTermicoUpdate) {
    const { data, error } = await supabase
      .from("mapa_termico")
      .update(mapa)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as MapaTermico;
  },

  async deleteMapaTermico(id: number) {
    const { error } = await supabase.from("mapa_termico").delete().eq("id", id);

    if (error) throw error;
    return true;
  },
};
