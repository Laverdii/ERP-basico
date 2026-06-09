  const { data, error } = await supabaseClient
    .from("orcamento_item")
    .select("produtoid, produtodesc, qt_produto, vl_unitario, vl_total")
    .order("produtoid", { ascending: true });

    console.log(data);
