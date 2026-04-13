-- Zabrana pristupa (admin u aplikaciji)
alter table public.profiles
  add column if not exists is_banned boolean not null default false;

-- Točno/netočno odgovori (HR)
update public.questions
set answer = case answer
  when 'True' then 'Točno'
  when 'False' then 'Netočno'
  else answer
end
where type = 'true_false';

-- Podkategorije: staro (EN ključevi) -> novo (HR), dok je category još uvijek EN
update public.questions q
set subcategory = v.new_sub
from (
  values
    ('General_Knowledge','Everyday_Knowledge','Svakodnevica'),
    ('General_Knowledge','Actualities','Aktualnosti'),
    ('General_Knowledge','Numbers_Records','Brojke i rekordi'),
    ('General_Knowledge','Basic_World_Facts','Svijet i zemljopis'),
    ('General_Knowledge','Logic_Common_Sense','Logika i zdrav razum'),
    ('General_Knowledge','Surprising_Facts_Trick_Questions','Zanimljivosti i trik pitanja'),
    ('General_Knowledge','Definitions_Terms','Definicije i pojmovi'),
    ('General_Knowledge','Abbreviations_Acronyms','Kratice'),
    ('General_Knowledge','Other','Ostalo'),
    ('History','Ancient_History','Stari vijek'),
    ('History','Medieval_History','Srednji vijek'),
    ('History','Modern_History','Novi vijek'),
    ('History','20th_Century','20. stoljeće'),
    ('History','Wars_Conflicts','Ratovi i sukobi'),
    ('History','Political_History','Politička povijest'),
    ('History','Cultural_History','Kulturna povijest'),
    ('History','Historical_Figures','Povijesne osobe'),
    ('History','Other','Ostalo'),
    ('Geography','Countries','Države'),
    ('Geography','Capitals','Glavni gradovi'),
    ('Geography','Flags','Zastave'),
    ('Geography','Cities','Gradovi'),
    ('Geography','Landmarks','Znamenitosti'),
    ('Geography','Physical_Geography','Fizička geografija'),
    ('Geography','Maps_Borders','Karte i granice'),
    ('Geography','Rivers_Mountains','Rijeke i planine'),
    ('Geography','Other','Ostalo'),
    ('Science','Physics','Fizika'),
    ('Science','Chemistry','Kemija'),
    ('Science','Biology','Biologija'),
    ('Science','Astronomy','Astronomija'),
    ('Science','Earth_Science','Zemlja i okoliš'),
    ('Science','Human_Body','Ljudsko tijelo'),
    ('Science','Inventions_Discoveries','Izumi i otkrića'),
    ('Science','Scientific_Facts','Znanstvene činjenice'),
    ('Science','Other','Ostalo'),
    ('Nature_Animals','Wild_Animals','Divlje životinje'),
    ('Nature_Animals','Domestic_Animals','Domaće životinje'),
    ('Nature_Animals','Marine_Life','Morski svijet'),
    ('Nature_Animals','Birds','Ptice'),
    ('Nature_Animals','Plants_Trees','Biljke i drveće'),
    ('Nature_Animals','Ecosystems','Ekosustavi'),
    ('Nature_Animals','Endangered_Species','Ugrožene vrste'),
    ('Nature_Animals','Animal_Facts','Činjenice o životinjama'),
    ('Nature_Animals','Other','Ostalo'),
    ('Sports','Football','Nogomet'),
    ('Sports','Basketball','Košarka'),
    ('Sports','Tennis','Tenis'),
    ('Sports','Olympics','Olimpijske igre'),
    ('Sports','Formula1_Motorsport','Formula i motosport'),
    ('Sports','American_Sports','Američki sportovi'),
    ('Sports','Sports_History','Povijest sporta'),
    ('Sports','Athletes','Sportaši'),
    ('Sports','Other','Ostalo'),
    ('Movies_TV','Actors_Actresses','Glumci i glumice'),
    ('Movies_TV','Directors','Redatelji'),
    ('Movies_TV','Movies_Genres','Žanrovi filma'),
    ('Movies_TV','TV_Shows','TV serije'),
    ('Movies_TV','Netflix_Streaming','Streaming'),
    ('Movies_TV','Oscars_Awards','Oscari i nagrade'),
    ('Movies_TV','Famous_Quotes','Poznati citati'),
    ('Movies_TV','Movie_Characters','Likovi iz filmova'),
    ('Movies_TV','Other','Ostalo'),
    ('Music','Artists_Bands','Izvođači i bendovi'),
    ('Music','Songs','Pjesme'),
    ('Music','Albums','Albumi'),
    ('Music','Lyrics','Tekstovi'),
    ('Music','Music_Genres','Glazbeni žanrovi'),
    ('Music','Music_Awards','Glazbene nagrade'),
    ('Music','80s_90s_2000s','80-e, 90-e, 2000-e'),
    ('Music','Music_History','Povijest glazbe'),
    ('Music','Other','Ostalo'),
    ('Literature_Books','Classic_Literature','Klasična književnost'),
    ('Literature_Books','Modern_Books','Moderna književnost'),
    ('Literature_Books','Authors','Autori'),
    ('Literature_Books','Characters','Likovi'),
    ('Literature_Books','Poetry','Poezija'),
    ('Literature_Books','Quotes','Citati'),
    ('Literature_Books','Children_Books','Dječje knjige'),
    ('Literature_Books','Fantasy_SciFi','Fantastika i SF'),
    ('Literature_Books','Other','Ostalo'),
    ('Art_Culture','Painting','Slikarstvo'),
    ('Art_Culture','Sculpture','Kiparstvo'),
    ('Art_Culture','Architecture','Arhitektura'),
    ('Art_Culture','Museums_Galleries','Muzeji i galerije'),
    ('Art_Culture','Cultural_Traditions','Tradicije kulture'),
    ('Art_Culture','Theatre','Kazalište'),
    ('Art_Culture','Dance','Ples'),
    ('Art_Culture','Art_History','Povijest umjetnosti'),
    ('Art_Culture','Other','Ostalo'),
    ('Food_Drink','World_Cuisine','Kuhinje svijeta'),
    ('Food_Drink','Ingredients','Sastojci'),
    ('Food_Drink','Dishes','Jela'),
    ('Food_Drink','Drinks_NonAlcoholic','Bezalkoholna pića'),
    ('Food_Drink','Alcoholic_Beverages','Alkoholna pića'),
    ('Food_Drink','Cooking_Techniques','Tehnike kuhanja'),
    ('Food_Drink','Desserts','Deserti'),
    ('Food_Drink','Food_Culture','Kultura hrane'),
    ('Food_Drink','Other','Ostalo'),
    ('Technology_Gaming','Video_Games','Videoigre'),
    ('Technology_Gaming','Consoles_Platforms','Konsole i platforme'),
    ('Technology_Gaming','Tech_Companies','Tehnološke tvrtke'),
    ('Technology_Gaming','Gadgets','Gadgeti'),
    ('Technology_Gaming','Internet_Web','Internet i web'),
    ('Technology_Gaming','Software','Softver'),
    ('Technology_Gaming','IT_Computing','Informatika'),
    ('Technology_Gaming','Gaming_History','Povijest igranja'),
    ('Technology_Gaming','Other','Ostalo'),
    ('Lifestyle','Celebrities','Slavne osobe'),
    ('Lifestyle','Fashion','Moda'),
    ('Lifestyle','Social_Media','Društvene mreže'),
    ('Lifestyle','Trends','Trendovi'),
    ('Lifestyle','Health_Fitness','Zdravlje i fitness'),
    ('Lifestyle','Relationships','Odnosi'),
    ('Lifestyle','Daily_Life','Svakodnevica'),
    ('Lifestyle','Influencers','Influenceri'),
    ('Lifestyle','Other','Ostalo')
) as v(old_cat, old_sub, new_sub)
where q.category = v.old_cat and q.subcategory = v.old_sub;

-- Kategorije EN -> HR nazivi
update public.questions
set category = case category
  when 'General_Knowledge' then 'Opće znanje'
  when 'History' then 'Povijest'
  when 'Geography' then 'Geografija'
  when 'Science' then 'Znanost'
  when 'Nature_Animals' then 'Priroda i životinje'
  when 'Sports' then 'Sport'
  when 'Movies_TV' then 'Film i televizija'
  when 'Music' then 'Glazba'
  when 'Literature_Books' then 'Književnost'
  when 'Art_Culture' then 'Umjetnost i kultura'
  when 'Food_Drink' then 'Hrana i piće'
  when 'Technology_Gaming' then 'Tehnologija i videoigre'
  when 'Lifestyle' then 'Život i trendovi'
  else category
end
where category in (
  'General_Knowledge','History','Geography','Science','Nature_Animals','Sports',
  'Movies_TV','Music','Literature_Books','Art_Culture','Food_Drink','Technology_Gaming','Lifestyle'
);
