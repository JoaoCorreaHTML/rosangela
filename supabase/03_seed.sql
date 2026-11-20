-- Dados existentes do site atual, sem alterações. Preço NULL = 'Preço sob consulta'.
-- Status 'disponivel' é o padrão (o site atual não indicava indisponibilidade); ajuste no painel.
insert into public.categories (name, slug, sort_order) values
  ('Perfumes','perfumes',1),('Roupas','roupas',2),('Bolsas','bolsas',3),('Calçados','calcados',4);

insert into public.products (name,slug,brand,price,category_id) select 'Asad','asad','Lattafa',null,id from public.categories where slug='perfumes';
insert into public.product_images (product_id,url,alt,is_main) select id,'assets/images/perfumes/asad.jpeg','Perfume Asad Lattafa',true from public.products where slug='asad';
insert into public.products (name,slug,brand,price,category_id) select 'Salvo Elixir','salvo-elixir','Maison Alhambra',null,id from public.categories where slug='perfumes';
insert into public.product_images (product_id,url,alt,is_main) select id,'assets/images/perfumes/salvo-elixir.jpeg','Perfume Salvo Elixir Maison Alhambra',true from public.products where slug='salvo-elixir';
insert into public.products (name,slug,brand,price,category_id) select 'Yeah! Man','yeah-man','Maison Alhambra',null,id from public.categories where slug='perfumes';
insert into public.product_images (product_id,url,alt,is_main) select id,'assets/images/perfumes/yeah-man.jpeg','Perfume Yeah! Man Maison Alhambra',true from public.products where slug='yeah-man';
insert into public.products (name,slug,brand,price,category_id) select 'Victorioso','victorioso','Maison Alhambra',null,id from public.categories where slug='perfumes';
insert into public.product_images (product_id,url,alt,is_main) select id,'assets/images/perfumes/victorioso.jpeg','Perfume Victorioso Maison Alhambra',true from public.products where slug='victorioso';
insert into public.products (name,slug,brand,price,category_id) select 'Atheeri','atheeri','Lattafa',700,id from public.categories where slug='perfumes';
insert into public.product_images (product_id,url,alt,is_main) select id,'assets/images/perfumes/atheeri.jpeg','Perfume Atheeri Lattafa',true from public.products where slug='atheeri';
insert into public.products (name,slug,brand,price,category_id) select 'Yara','yara','Lattafa',350,id from public.categories where slug='perfumes';
insert into public.product_images (product_id,url,alt,is_main) select id,'assets/images/perfumes/yara.jpeg','Perfume Yara Lattafa',true from public.products where slug='yara';
insert into public.products (name,slug,brand,price,category_id) select 'No. 2 Men','no-2-men','Maison Alhambra',300,id from public.categories where slug='perfumes';
insert into public.product_images (product_id,url,alt,is_main) select id,'assets/images/perfumes/no-2-men.jpeg','Perfume No. 2 Men Maison Alhambra',true from public.products where slug='no-2-men';
insert into public.products (name,slug,brand,price,category_id) select 'Opulent Dubai','opulent-dubai','Lattafa',340,id from public.categories where slug='perfumes';
insert into public.product_images (product_id,url,alt,is_main) select id,'assets/images/perfumes/opulent-dubai.jpeg','Perfume Opulent Dubai Lattafa',true from public.products where slug='opulent-dubai';
insert into public.products (name,slug,brand,price,category_id) select 'Delilah Pour Femme','delilah-pour-femme','Maison Alhambra',330,id from public.categories where slug='perfumes';
insert into public.product_images (product_id,url,alt,is_main) select id,'assets/images/perfumes/delilah-pour-femme.jpeg','Perfume Delilah Pour Femme Maison Alhambra',true from public.products where slug='delilah-pour-femme';
insert into public.products (name,slug,brand,price,category_id) select 'Fakhar Gold','fakhar-gold','Lattafa',360,id from public.categories where slug='perfumes';
insert into public.product_images (product_id,url,alt,is_main) select id,'assets/images/perfumes/fakhar-gold.jpeg','Perfume Fakhar Gold Lattafa',true from public.products where slug='fakhar-gold';
insert into public.products (name,slug,brand,price,category_id) select 'Asad Zanzibar','asad-zanzibar','Lattafa',370,id from public.categories where slug='perfumes';
insert into public.product_images (product_id,url,alt,is_main) select id,'assets/images/perfumes/asad-zanzibar.jpeg','Perfume Asad Zanzibar Lattafa',true from public.products where slug='asad-zanzibar';
insert into public.product_images (product_id,url,alt,is_main,position) select id,'assets/images/perfumes/yara-2.jpeg','Perfume Yara Lattafa - imagem adicional',false,1 from public.products where slug='yara';
insert into public.products (name,slug,description,price,badges,category_id) select 'Parka de Microfibra','parka-de-microfibra-1','Tecido microfibra impermeável. Tamanhos: do P ao G.',350,array['Novo','Estoque Limitado'],id from public.categories where slug='roupas';
insert into public.product_images (product_id,url,alt,is_main) select id,'assets/images/roupa1.webp','Parka de microfibra impermeável',true from public.products where slug='parka-de-microfibra-1';
insert into public.products (name,slug,description,price,badges,category_id) select 'Parka de Microfibra','parka-de-microfibra-2','Tecido microfibra impermeável. Tamanhos: do P ao G.',350,array['Novo','Estoque Limitado'],id from public.categories where slug='roupas';
insert into public.product_images (product_id,url,alt,is_main) select id,'assets/images/roupa2.webp','Parka de microfibra impermeável',true from public.products where slug='parka-de-microfibra-2';
insert into public.products (name,slug,description,price,badges,category_id) select 'Parka de Microfibra','parka-de-microfibra-3','Tecido microfibra impermeável. Tamanhos: do P ao G.',350,array['Novo','Estoque Limitado'],id from public.categories where slug='roupas';
insert into public.product_images (product_id,url,alt,is_main) select id,'assets/images/roupa3.webp','Parka de microfibra impermeável',true from public.products where slug='parka-de-microfibra-3';
insert into public.products (name,slug,description,price,badges,category_id) select 'Parka de Microfibra','parka-de-microfibra-4','Tecido microfibra impermeável. Tamanhos: do P ao G.',350,array['Novo','Estoque Limitado'],id from public.categories where slug='roupas';
insert into public.product_images (product_id,url,alt,is_main) select id,'assets/images/roupa4.webp','Parka de microfibra impermeável',true from public.products where slug='parka-de-microfibra-4';
