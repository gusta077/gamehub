import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import './App.css'

function App() {
  const [page, setPage] = useState('login')
  const [isLogged, setIsLogged] = useState(false)
  const [user, setUser] = useState(null)

  const [games, setGames] = useState([])
  const [selectedGame, setSelectedGame] = useState(null)

  const [gameReviews, setGameReviews] = useState([])
  const [userReviews, setUserReviews] = useState([])
  const [communityReviews, setCommunityReviews] = useState([])
  
  // States do Filtro do Catálogo
  const [catalogDeveloperFilter, setCatalogDeveloperFilter] = useState("todas")

  // States dos Filtros da Comunidade
  const [selectedFilter, setSelectedFilter] = useState("todos")
  const [reviewDeveloperFilter, setReviewDeveloperFilter] = useState("todas")
  const [sortOrder, setSortOrder] = useState("recente")
  const [ratingFilter, setRatingFilter] = useState("todas")

  const [rating, setRating] = useState(0)
  const [reviewText, setReviewText] = useState('')

  const [developerGames, setDeveloperGames] = useState([])

  // States Cadastro
  const [newGameTitle, setNewGameTitle] = useState('')
  const [newGameImageUrl, setNewGameImageUrl] = useState('')
  const [newGameCompanyName, setNewGameCompanyName] = useState('')
  const [newGameContact, setNewGameContact] = useState('')
  const [newGameDescription, setNewGameDescription] = useState('')
  const [newMediaUrls, setNewMediaUrls] = useState([''])

  // States Edição
  const [editingGame, setEditingGame] = useState(null)
  const [editGameTitle, setEditGameTitle] = useState('')
  const [editGameImageUrl, setEditGameImageUrl] = useState('')
  const [editGameCompanyName, setEditGameCompanyName] = useState('')
  const [editGameContact, setEditGameContact] = useState('')
  const [editGameDescription, setEditGameDescription] = useState('')
  const [editMediaUrls, setEditMediaUrls] = useState([''])

  const isDeveloper = user?.user_metadata?.role === 'developer'
  async function handleImageUpload(e, isEdit = false) {
  const file = e.target.files[0]

  if (!file) return

  const fileExt = file.name.split(".").pop()
  const fileName = `${Date.now()}_${Math.random()}.${fileExt}`

  const { error } = await supabase.storage
    .from("game-images")
    .upload(fileName, file)

  if (error) {
    alert("Erro ao enviar imagem: " + error.message)
    return
  }

  const { data } = supabase.storage
    .from("game-images")
    .getPublicUrl(fileName)

  if (isEdit) {
    setEditGameImageUrl(data.publicUrl)
  } else {
    setNewGameImageUrl(data.publicUrl)
  }

  alert("Imagem enviada com sucesso!")
}
async function handleDynamicMediaUpload(e, index, isEdit = false) {
  const file = e.target.files[0];
  if (!file) return;

  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}_${Math.random()}.${fileExt}`;

  const { error } = await supabase.storage
    .from("game-images")
    .upload(fileName, file);

  if (error) {
    alert("Erro ao subir arquivo: " + error.message);
    return;
  }

  const { data } = supabase.storage
    .from("game-images")
    .getPublicUrl(fileName);

  if (isEdit) {
    const updated = [...editMediaUrls];
    updated[index] = data.publicUrl;
    setEditMediaUrls(updated);
  } else {
    const updated = [...newMediaUrls];
    updated[index] = data.publicUrl;
    setNewMediaUrls(updated);
  }

  alert("Arquivo enviado com sucesso!");
}

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        setUser(session.user)
        setIsLogged(true)
        setPage('catalog')
      }
    }

    checkUser()
  }, [])

  useEffect(() => {
    if (isLogged) {
      fetchGames()
    }
  }, [isLogged])

  async function fetchGames() {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .order('id', { ascending: false })

    if (error) {
      console.log(error.message)
      return
    }

    if (data && data.length > 0) {
      setGames(data)
    } else {
      await seedDatabase()
    }
  }

  async function seedDatabase() {
    const initialGames = [
      {
        title: "Counter-Strike 2",
        company_name: "Valve",
        imageurl: "https://cdn.akamai.steamstatic.com/steam/apps/730/header.jpg",
        description: "Um jogo competitivo de tiro em primeira pessoa focado em estratégia, precisão e trabalho em equipe.",
        media_urls: ["https://cdn.akamai.steamstatic.com/steam/apps/730/header.jpg"]
      },
      {
        title: "Elden Ring",
        company_name: "FromSoftware",
        imageurl: "https://cdn.akamai.steamstatic.com/steam/apps/1245620/header.jpg",
        description: "RPG de ação em mundo aberto com exploração, chefes desafiadores e uma ambientação de fantasia sombria.",
        media_urls: ["https://cdn.akamai.steamstatic.com/steam/apps/1245620/header.jpg"]
      },
      {
        title: "Forza Horizon 5",
        company_name: "Playground Games",
        imageurl: "https://cdn.akamai.steamstatic.com/steam/apps/1551360/header.jpg",
        description: "Jogo de corrida em mundo aberto com carros variados, eventos e cenários inspirados no México.",
        media_urls: ["https://cdn.akamai.steamstatic.com/steam/apps/1551360/header.jpg"]
      },
      {
        title: "God of War",
        company_name: "Santa Monica Studio",
        imageurl: "https://cdn.akamai.steamstatic.com/steam/apps/1593500/header.jpg",
        description: "Aventura de ação focada na jornada de Kratos e Atreus em um mundo inspirado na mitologia nórdica.",
        media_urls: ["https://cdn.akamai.steamstatic.com/steam/apps/1593500/header.jpg"]
      },
      {
        title: "Grand Theft Auto V",
        company_name: "Rockstar Games",
        imageurl: "https://cdn.akamai.steamstatic.com/steam/apps/271590/header.jpg",
        description: "Jogo de ação em mundo aberto com missões, exploração urbana e modo online.",
        media_urls: ["https://cdn.akamai.steamstatic.com/steam/apps/271590/header.jpg"]
      },
      {
        title: "Hollow Knight",
        company_name: "Team Cherry",
        imageurl: "https://cdn.akamai.steamstatic.com/steam/apps/367520/header.jpg",
        description: "Metroidvania em 2D com exploração, combate desafiador e uma atmosfera misteriosa.",
        media_urls: ["https://cdn.akamai.steamstatic.com/steam/apps/367520/header.jpg"]
      },
      {
        title: "Red Dead Redemption 2",
        company_name: "Rockstar Games",
        imageurl: "https://cdn.akamai.steamstatic.com/steam/apps/1174180/header.jpg",
        description: "Aventura em mundo aberto no velho oeste, com narrativa cinematográfica e exploração detalhada.",
        media_urls: ["https://cdn.akamai.steamstatic.com/steam/apps/1174180/header.jpg"]
      },
      {
        title: "Resident Evil 4",
        company_name: "Capcom",
        imageurl: "https://cdn.akamai.steamstatic.com/steam/apps/2050650/header.jpg",
        description: "Survival horror de ação com combate intenso, atmosfera sombria e foco em sobrevivência.",
        media_urls: ["https://cdn.akamai.steamstatic.com/steam/apps/2050650/header.jpg"]
      },
      {
        title: "The Last of Us Part I",
        company_name: "Naughty Dog",
        imageurl: "https://cdn.akamai.steamstatic.com/steam/apps/1888930/header.jpg",
        description: "Jogo narrativo de ação e sobrevivência em um mundo pós-apocalíptico.",
        media_urls: ["https://cdn.akamai.steamstatic.com/steam/apps/1888930/header.jpg"]
      },
      {
        title: "The Witcher 3: Wild Hunt",
        company_name: "CD Projekt Red",
        imageurl: "https://cdn.akamai.steamstatic.com/steam/apps/292030/header.jpg",
        description: "RPG de mundo aberto com escolhas, narrativa profunda e caçadas a monstros.",
        media_urls: ["https://cdn.akamai.steamstatic.com/steam/apps/292030/header.jpg"]
      }
    ]

    const { error } = await supabase.from('games').insert(initialGames)

    if (!error) {
      fetchGames()
    }
  }

  async function openGameDetails(game) {
    setSelectedGame(game)
    setPage('details')
    setRating(0)
    setReviewText('')

    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('game_id', game.id)
      .order('id', { ascending: false })

    if (error) {
      alert(error.message)
    } else {
      setGameReviews(data || [])
    }
  }

  async function openProfile() {
    setPage('profile')

    const { data, error } = await supabase
      .from('reviews')
      .select('*, games(title)')
      .eq('user_id', user.id)
      .order('id', { ascending: false })

    if (error) {
      alert(error.message)
    } else {
      setUserReviews(data || [])
    }
  }

  async function openCommunityReviews() {
    setPage('community')

    const { data, error } = await supabase
      .from('reviews')
      .select('*, games(title, imageurl, company_name)')
      .order('id', { ascending: false })

    if (error) {
      alert(error.message)
    } else {
      setCommunityReviews(data || [])
    }
  }

  async function openDeveloperArea() {
    if (!isDeveloper) {
      alert("Apenas contas de desenvolvedor podem acessar essa área.")
      return
    }

    setPage('developer')
    setEditingGame(null)
    await fetchDeveloperGames()
  }

  async function fetchDeveloperGames() {
    if (!user) return

    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('developer_id', user.id)
      .order('id', { ascending: false })

    if (error) {
      alert(error.message)
    } else {
      setDeveloperGames(data || [])
    }
  }

  async function handleLogin(e) {
    e.preventDefault()

    const email = e.target.email.value
    const password = e.target.password.value

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      alert(error.message)
    } else {
      setUser(data.user)
      setIsLogged(true)
      setPage('catalog')
    }
  }

  async function handleSignup(e) {
    e.preventDefault()

    const name = e.target.name.value
    const email = e.target.email.value
    const password = e.target.password.value
    const role = e.target.role.value

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: name,
          role: role
        }
      }
    })

    if (error) {
      alert(error.message)
    } else {
      alert("Cadastro realizado com sucesso! Verifique seu email e após isso prossiga ao Login.")
      setPage('login')
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()

    setIsLogged(false)
    setUser(null)
    setPage('login')
    setGames([])
    setSelectedGame(null)
    setGameReviews([])
    setUserReviews([])
    setCommunityReviews([])
    setDeveloperGames([])
  }

  async function sendReview() {
    if (rating === 0) {
      alert("Selecione uma nota!")
      return
    }

    const { error } = await supabase.from('reviews').insert([
      {
        game_id: selectedGame.id,
        user_id: user.id,
        user_email: user.email,
        rating: rating,
        comment: reviewText
      }
    ])

    if (error) {
      alert(error.message)
    } else {
      alert("Avaliação enviada!")
      setReviewText('')
      setRating(0)
      openGameDetails(selectedGame)
    }
  }

  function handleNewMediaChange(index, value) {
    const updatedUrls = [...newMediaUrls]
    updatedUrls[index] = value
    setNewMediaUrls(updatedUrls)
  }

  function handleAddNewMediaInput() {
    if (newMediaUrls.length < 5) {
      setNewMediaUrls([...newMediaUrls, ''])
    }
  }

  function handleRemoveNewMediaInput(index) {
    const updatedUrls = newMediaUrls.filter((_, i) => i !== index)
    setNewMediaUrls(updatedUrls.length > 0 ? updatedUrls : [''])
  }

  function handleEditMediaChange(index, value) {
    const updatedUrls = [...editMediaUrls]
    updatedUrls[index] = value
    setEditMediaUrls(updatedUrls)
  }

  function handleAddEditMediaInput() {
    if (editMediaUrls.length < 5) {
      setEditMediaUrls([...editMediaUrls, ''])
    }
  }

  function handleRemoveEditMediaInput(index) {
    const updatedUrls = editMediaUrls.filter((_, i) => i !== index)
    setEditMediaUrls(updatedUrls.length > 0 ? updatedUrls : [''])
  }

  function getAllMediaUrls(mainImage, mediaArray) {
    const extraMedia = mediaArray.map(url => url.trim()).filter(url => url.length > 0)
    const allMedia = [mainImage, ...extraMedia].filter(Boolean)
    return [...new Set(allMedia)]
  }

  function isVideoUrl(url) {
    const cleanUrl = url.toLowerCase().split('?')[0]
    return (
      cleanUrl.endsWith('.mp4') ||
      cleanUrl.endsWith('.webm') ||
      cleanUrl.endsWith('.ogg')
    )
  }

  function getYoutubeEmbedUrl(url) {
    if (!url) return null

    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('watch?v=')[1]?.split('&')[0]
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null
    }

    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0]
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null
    }

    return null
  }

  function renderMedia(url, index) {
    const youtubeUrl = getYoutubeEmbedUrl(url)

    if (youtubeUrl) {
      return (
        <iframe
          src={youtubeUrl}
          title={`Vídeo do jogo ${index + 1}`}
          className="media-item"
          allowFullScreen
        ></iframe>
      )
    }

    if (isVideoUrl(url)) {
      return (
        <video className="media-item" controls>
          <source src={url} />
          Seu navegador não suporta vídeo.
        </video>
      )
    }

    return (
      <img
        src={url}
        alt={`Mídia do jogo ${index + 1}`}
        className="media-item"
      />
    )
  }

  async function addGame(e) {
    e.preventDefault()

    if (!isDeveloper) {
      alert("Apenas desenvolvedores podem adicionar jogos.")
      return
    }

    if (!newGameTitle.trim() || !newGameCompanyName.trim()) {
      alert("Preencha o nome do jogo e da desenvolvedora.")
      return
    }

    if (!newGameImageUrl.trim()) {
      alert("Coloque a URL da imagem principal.")
      return
    }

    if (!newGameDescription.trim()) {
      alert("Digite uma descrição para o jogo.")
      return
    }

    const mediaUrls = getAllMediaUrls(newGameImageUrl, newMediaUrls)

    const { error } = await supabase.from('games').insert([
      {
        title: newGameTitle,
        imageurl: newGameImageUrl,
        description: newGameDescription,
        media_urls: mediaUrls,
        company_name: newGameCompanyName,
        company_contact: newGameContact,
        developer_id: user.id
      }
    ])

    if (error) {
      alert(error.message)
    } else {
      alert("Jogo adicionado com sucesso!")

      setNewGameTitle('')
      setNewGameImageUrl('')
      setNewGameDescription('')
      setNewGameCompanyName('')
      setNewGameContact('')
      setNewMediaUrls([''])

      await fetchGames()
      await fetchDeveloperGames()
    }
  }

  function startEditGame(game) {
    setEditingGame(game)

    setEditGameTitle(game.title || '')
    setEditGameImageUrl(game.imageurl || '')
    setEditGameDescription(game.description || '')
    setEditGameCompanyName(game.company_name || '')
    setEditGameContact(game.company_contact || '')

    const mediaWithoutMainImage = game.media_urls
      ? game.media_urls.filter(url => url !== game.imageurl)
      : []

    setEditMediaUrls(mediaWithoutMainImage.length > 0 ? mediaWithoutMainImage : [''])

    setTimeout(() => {
      const editArea = document.getElementById('edit-game-area')
      if (editArea) {
        editArea.scrollIntoView({ behavior: 'smooth' })
      }
    }, 100)
  }

  function cancelEditGame() {
    setEditingGame(null)
    setEditGameTitle('')
    setEditGameImageUrl('')
    setEditGameDescription('')
    setEditGameCompanyName('')
    setEditGameContact('')
    setEditMediaUrls([''])
  }

  async function updateGame(e) {
    e.preventDefault()

    if (!editingGame) return

    if (!editGameTitle.trim() || !editGameCompanyName.trim()) {
      alert("Preencha o nome do jogo e da desenvolvedora.")
      return
    }

    if (!editGameImageUrl.trim()) {
      alert("Coloque a URL da imagem principal.")
      return
    }

    if (!editGameDescription.trim()) {
      alert("Digite uma descrição para o jogo.")
      return
    }

    const mediaUrls = getAllMediaUrls(editGameImageUrl, editMediaUrls)

    const { error } = await supabase
      .from('games')
      .update({
        title: editGameTitle,
        imageurl: editGameImageUrl,
        description: editGameDescription,
        media_urls: mediaUrls,
        company_name: editGameCompanyName,
        company_contact: editGameContact
      })
      .eq('id', editingGame.id)
      .eq('developer_id', user.id)

    if (error) {
      alert(error.message)
    } else {
      alert("Jogo atualizado com sucesso!")

      cancelEditGame()
      await fetchGames()
      await fetchDeveloperGames()
    }
  }

  async function deleteGame(gameId) {
    const confirmDelete = window.confirm(
      "Tem certeza que deseja apagar este jogo? As avaliações vinculadas a ele também serão perdidas."
    )
    
    if (!confirmDelete) return

    await supabase
      .from('reviews')
      .delete()
      .eq('game_id', gameId)

    const { error } = await supabase
      .from('games')
      .delete()
      .eq('id', gameId)
      .eq('developer_id', user.id)

    if (error) {
      alert("Erro ao apagar o jogo:\n" + error.message)
    } else {
      alert("Jogo apagado com sucesso!")
      
      if (editingGame?.id === gameId) {
        cancelEditGame()
      }
      
      await fetchGames()
      await fetchDeveloperGames()
    }
  }

  const totalReviews = userReviews.length

  const averageRating = totalReviews > 0
    ? (userReviews.reduce((acc, rev) => acc + rev.rating, 0) / totalReviews).toFixed(1)
    : "0.0"

  return (
    <div id="app">
      {!isLogged ? (
        <div className="auth-container">
          <div className="form-box">
            <h2>GameHub</h2>

            {page === 'login' ? (
              <form onSubmit={handleLogin}>
                <input
                  name="email"
                  type="email"
                  placeholder="Email"
                  required
                />

                <input
                  name="password"
                  type="password"
                  placeholder="Senha"
                  required
                />

                <button type="submit" className="btn-auth">
                  Entrar
                </button>

                <p>
                  Não tem conta?{' '}
                  <a href="#" onClick={() => setPage('signup')}>
                    Cadastre-se
                  </a>
                </p>
              </form>
            ) : (
              <form onSubmit={handleSignup}>
                <input
                  name="name"
                  type="text"
                  placeholder="Nome"
                  required
                />

                <input
                  name="email"
                  type="email"
                  placeholder="Email"
                  required
                />

                <input
                  name="password"
                  type="password"
                  placeholder="Senha"
                  required
                />

                <select name="role" className="form-select" required>
                  <option value="player">Sou jogador</option>
                  <option value="developer">Sou desenvolvedor</option>
                </select>

                <button type="submit" className="btn-auth signup">
                  Cadastrar
                </button>

                <p>
                  Já tem conta?{' '}
                  <a href="#" onClick={() => setPage('login')}>
                    Login
                  </a>
                </p>
              </form>
            )}
          </div>
        </div>
      ) : (
        <div id="main-layout">
          <header className="navbar">
            <div className="nav-brand" onClick={() => setPage('catalog')}>
              GameHub
            </div>

            <nav className="nav-links">
              <span onClick={() => setPage('catalog')}>
                Catálogo
              </span>

              <span onClick={openCommunityReviews}>
                Reviews da Comunidade
              </span>

              {isDeveloper && (
                <span onClick={openDeveloperArea}>
                  Área do Desenvolvedor
                </span>
              )}

              <span onClick={openProfile} className="nav-item">
                Perfil
              </span>

              <button onClick={handleLogout} className="btn-exit">
                Sair
              </button>
            </nav>
          </header>

          <main className="content">
            {page === 'catalog' && (
              <div className="catalog-wrapper">
                <h1>Catálogo de Jogos</h1>

                <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>Desenvolvedora:</label>
                  <select
                    className="form-select"
                    value={catalogDeveloperFilter}
                    onChange={(e) => setCatalogDeveloperFilter(e.target.value)}
                    style={{ width: 'auto', margin: 0, padding: '8px 12px' }}
                  >
                    <option value="todas">Todas as desenvolvedoras</option>
                    {[...new Set(games.map(g => g.company_name).filter(Boolean))].map(company => (
                      <option key={company} value={company}>{company}</option>
                    ))}
                  </select>
                </div>

                <hr className="title-divider" />

                <div className="game-grid">
                  {games
                    .filter(game => catalogDeveloperFilter === "todas" || game.company_name === catalogDeveloperFilter)
                    .map(game => (
                      <div
                        key={game.id}
                        className="game-card"
                        onClick={() => openGameDetails(game)}
                      >
                        <img src={game.imageurl} alt={game.title} />
                        <div className="game-title-bar">{game.title}</div>
                      </div>
                  ))}
                </div>
              </div>
            )}

            {page === 'details' && selectedGame && (
              <div className="details-wrapper">
                <button className="btn-back" onClick={() => setPage('catalog')}>
                  ← Voltar ao Catálogo
                </button>

                <div className="details-main-card">
                  <div className="details-image-section">
                    <img src={selectedGame.imageurl} alt={selectedGame.title} />
                    
                    {selectedGame.company_contact && (
                      <div className="game-contact-box">
                        <strong>Informações de Contato</strong>
                        <p style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap' }}>
                          {selectedGame.company_contact}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="details-info-section">
                    <h1>{selectedGame.title}</h1>

                    {selectedGame.company_name && (
                      <h3 style={{ color: 'var(--accent-blue)', marginTop: '-10px', fontSize: '1.1rem', marginBottom: '20px' }}>
                        Desenvolvido por: {selectedGame.company_name}
                      </h3>
                    )}

                    {selectedGame.description && (
                      <p className="game-description">
                        {selectedGame.description}
                      </p>
                    )}

                    {selectedGame.media_urls && selectedGame.media_urls.length > 0 && (
                      <div className="media-gallery">
                        <h3>Fotos e vídeos do jogo</h3>

                        <div className="media-grid">
                          {selectedGame.media_urls.map((url, index) => (
                            <div key={index} className="media-box">
                              {renderMedia(url, index)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <p className="form-subtitle">
                      Deixe sua avaliação para este jogo.
                    </p>

                    <div className="star-input-container">
                      {[1, 2, 3, 4, 5].map(num => (
                        <span
                          key={num}
                          className={rating >= num ? "star-input active" : "star-input"}
                          onClick={() => setRating(num)}
                        >
                          ★
                        </span>
                      ))}
                    </div>

                    <textarea
                      className="review-textarea"
                      placeholder="Sua análise (opcional)"
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                    ></textarea>

                    <button onClick={sendReview} className="btn-submit-review">
                      ENVIAR AVALIAÇÃO
                    </button>
                  </div>
                </div>

                <div className="community-section">
                  <h2 className="community-title">Avaliações deste jogo</h2>

                  <div className="reviews-feed">
                    {gameReviews.length > 0 ? (
                      gameReviews.map(rev => (
                        <div key={rev.id} className="review-card">
                          <div className="review-header">
                            <strong>{rev.user_email}</strong>

                            <div className="review-card-stars">
                              {[...Array(5)].map((_, i) => (
                                <span
                                  key={i}
                                  className={rev.rating > i ? "star-small active" : "star-small"}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                          </div>

                          <p className="review-card-comment">
                            {rev.comment ? `"${rev.comment}"` : "Sem comentário."}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="empty-state-card">
                        <p>Ainda não existem avaliações para este jogo.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {page === 'community' && (
              <div className="community-container">
                <h1>Reviews da Comunidade</h1>

                <p className="form-subtitle">
                  Veja as avaliações feitas por todos os jogadores.
                </p>

                <div style={{
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '15px', 
                  marginBottom: '24px',
                  backgroundColor: 'var(--bg-card-soft)',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)'
                }}>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Jogo</label>
                    <select 
                      className="form-select" 
                      value={selectedFilter}
                      onChange={(e) => setSelectedFilter(e.target.value)}
                      style={{ margin: 0, padding: '8px 12px' }}
                    >
                      <option value="todos">Todos os jogos</option>
                      {[...new Set(games.map(g => g.title).filter(Boolean))].map(gameTitle => (
                        <option key={gameTitle} value={gameTitle}>{gameTitle}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Desenvolvedora</label>
                    <select 
                      className="form-select" 
                      value={reviewDeveloperFilter}
                      onChange={(e) => setReviewDeveloperFilter(e.target.value)}
                      style={{ margin: 0, padding: '8px 12px' }}
                    >
                      <option value="todas">Todas as desenvolvedoras</option>
                      {[...new Set(games.map(g => g.company_name).filter(Boolean))].map(companyTitle => (
                        <option key={companyTitle} value={companyTitle}>{companyTitle}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Nota</label>
                    <select 
                      className="form-select" 
                      value={ratingFilter}
                      onChange={(e) => setRatingFilter(e.target.value)}
                      style={{ margin: 0, padding: '8px 12px' }}
                    >
                      <option value="todas">Todas as notas</option>
                      <option value="5">5 Estrelas</option>
                      <option value="4">4 Estrelas</option>
                      <option value="3">3 Estrelas</option>
                      <option value="2">2 Estrelas</option>
                      <option value="1">1 Estrela</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Ordem</label>
                    <select 
                      className="form-select" 
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      style={{ margin: 0, padding: '8px 12px' }}
                    >
                      <option value="recente">Mais Recentes</option>
                      <option value="antigo">Mais Antigos</option>
                    </select>
                  </div>

                </div>

                <hr className="title-divider" />

                <div className="reviews-feed">
                  {communityReviews.length > 0 ? (
                    communityReviews
                      .filter(rev => selectedFilter === "todos" || rev.games?.title === selectedFilter)
                      .filter(rev => reviewDeveloperFilter === "todas" || rev.games?.company_name === reviewDeveloperFilter)
                      .filter(rev => ratingFilter === "todas" || rev.rating.toString() === ratingFilter)
                      .sort((a, b) => {
                        if (sortOrder === "recente") {
                          return b.id - a.id; 
                        } else {
                          return a.id - b.id; 
                        }
                      })
                      .map(rev => (
                        <div key={rev.id} className="review-card">
                          <div className="review-header">
                            <div className="community-game-info">
                              {rev.games?.imageurl && (
                                <img
                                  src={rev.games.imageurl}
                                  alt={rev.games?.title || "Jogo"}
                                  className="community-game-img"
                                />
                              )}

                              <div>
                                <strong>{rev.games?.title || "Jogo desconhecido"}</strong>
                                <p className="review-author">
                                  Avaliado por: {rev.user_email}
                                </p>
                              </div>
                            </div>

                            <div className="review-card-stars">
                              {[...Array(5)].map((_, i) => (
                                <span
                                  key={i}
                                  className={rev.rating > i ? "star-small active" : "star-small"}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                          </div>

                          <p className="review-card-comment">
                            {rev.comment ? `"${rev.comment}"` : "Sem comentário."}
                          </p>
                        </div>
                      ))
                  ) : (
                    <div className="empty-state-card">
                      <p>Ainda não existem avaliações da comunidade com esses filtros.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {page === 'developer' && isDeveloper && (
              <div className="developer-container">
                <div className="developer-header">
                  <h1>Área do Desenvolvedor</h1>
                  <p>
                    Cadastre, edite e gerencie os jogos que você adicionou ao GameHub.
                  </p>
                </div>

                <div className="developer-card">
                  <h2>Adicionar novo jogo</h2>

                  <div className="developer-form-split">
                    
                    <form onSubmit={addGame}>
                      <label>Nome do jogo</label>
                      <input
                        type="text"
                        placeholder="Ex: Meu Jogo Indie"
                        value={newGameTitle}
                        onChange={(e) => setNewGameTitle(e.target.value)}
                        required
                      />
<label>Imagem principal (Enviar arquivo ou usar URL)</label>

<input
  type="file"
  accept="image/*"
  onChange={(e) => handleImageUpload(e, false)}
  style={{ marginBottom: "10px" }}
/>

<input
  type="url"
  placeholder="https://exemplo.com/capa.jpg"
  value={newGameImageUrl}
  onChange={(e) => setNewGameImageUrl(e.target.value)}
  required
/>
                      <label>Nome da Empresa (Desenvolvedora)</label>
                      <input
                        type="text"
                        placeholder="Ex: Epic Games"
                        value={newGameCompanyName}
                        onChange={(e) => setNewGameCompanyName(e.target.value)}
                        required
                      />

                      <label>Contato da Empresa</label>
                      <input
                        type="text"
                        placeholder="Ex: suporte@empresa.com / site.com"
                        value={newGameContact}
                        onChange={(e) => setNewGameContact(e.target.value)}
                      />

                      <label>Descrição do jogo</label>
                      <textarea
                        className="developer-textarea"
                        placeholder="Fale sobre a história, gameplay, gênero e principais características do jogo."
                        value={newGameDescription}
                        onChange={(e) => setNewGameDescription(e.target.value)}
                        required
                      ></textarea>

                      <label>Fotos ou vídeos adicionais (Máximo: 5)</label>
                      <div>
                      {newMediaUrls.map((url, index) => (
  <div
    key={index}
    className="dynamic-input-row"
    style={{
      display: "flex",
      flexDirection: "column",
      gap: "5px",
      marginBottom: "15px",
    }}
  >
    <label>Enviar imagem ou vídeo</label>

    <input
      type="file"
      accept="image/*,video/*"
      onChange={(e) => handleDynamicMediaUpload(e, index, false)}
    />

    <label>Ou cole um link</label>

    <input
      type="url"
      placeholder="https://..."
      value={url}
      onChange={(e) => handleNewMediaChange(index, e.target.value)}
    />

    {newMediaUrls.length > 1 && (
      <button
        type="button"
        className="btn-remove-input"
        onClick={() => handleRemoveNewMediaInput(index)}
      >
        Remover
      </button>
    )}
  </div>
))}
                        {newMediaUrls.length < 5 && (
                          <button
                            type="button"
                            className="btn-add-input"
                            onClick={handleAddNewMediaInput}
                          >
                            + Adicionar mais um link
                          </button>
                        )}
                      </div>

                      <button type="submit" className="btn-add-game">
                        Adicionar jogo
                      </button>
                    </form>

                    <div className="live-preview-box">
                      <h3 className="preview-title">Prévia da Página do Jogo</h3>
                      
                      <div className="details-main-card preview-mode">
                        <div className="details-image-section">
                          {newGameImageUrl ? (
                            <img src={newGameImageUrl} alt="Prévia do jogo" />
                          ) : (
                            <div style={{ backgroundColor: 'var(--bg-input)', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)' }}>
                              Capa do Jogo
                            </div>
                          )}
                          
                          {newGameContact && (
                            <div className="game-contact-box">
                              <strong>Informações de Contato</strong>
                              <p style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap' }}>
                                {newGameContact}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="details-info-section">
                          <h1>{newGameTitle || "Nome do Jogo"}</h1>

                          <h3 style={{ color: 'var(--accent-blue)', marginTop: '-10px', fontSize: '1.1rem', marginBottom: '20px' }}>
                            Desenvolvido por: {newGameCompanyName || "Sua Empresa"}
                          </h3>

                          <p className="game-description" style={{ minHeight: '60px' }}>
                            {newGameDescription || "A descrição do seu jogo aparecerá aqui..."}
                          </p>

                          {getAllMediaUrls(newGameImageUrl, newMediaUrls).length > 0 && (
                            <div className="media-gallery">
                              <h3 style={{ fontSize: '15px' }}>Fotos e vídeos do jogo</h3>
                              <div className="media-grid">
                                {getAllMediaUrls(newGameImageUrl, newMediaUrls).map((url, index) => (
                                  <div key={index} className="media-box">
                                    {renderMedia(url, index)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                <div className="developer-card developer-list-card">
                  <h2>Meus jogos adicionados</h2>

                  {developerGames.length > 0 ? (
                    <div className="developer-games-list">
                      {developerGames.map(game => (
                        <div key={game.id} className="developer-game-item">
                          <img src={game.imageurl} alt={game.title} />

                          <div className="developer-game-info">
                            <h3>{game.title}</h3>
                            <p>{game.description || "Sem descrição."}</p>
                          </div>

                          <div className="developer-game-actions">
                            <button
                              className="btn-edit-game"
                              onClick={() => startEditGame(game)}
                            >
                              Editar
                            </button>
                            <button
                              className="btn-delete-game"
                              onClick={() => deleteGame(game.id)}
                            >
                              Apagar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state-card">
                      <p>Você ainda não adicionou nenhum jogo.</p>
                    </div>
                  )}
                </div>

                {editingGame && (
                  <div id="edit-game-area" className="developer-card edit-game-card">
                    <h2>Editando: {editingGame.title}</h2>

                    <div className="developer-form-split">
                      <form onSubmit={updateGame}>
                        <label>Nome do jogo</label>
                        <input
                          type="text"
                          value={editGameTitle}
                          onChange={(e) => setEditGameTitle(e.target.value)}
                          required
                        />

                       <label>Imagem principal (Enviar arquivo ou usar URL)</label>

<input
  type="file"
  accept="image/*"
  onChange={(e) => handleImageUpload(e, true)}
  style={{ marginBottom: "10px" }}
/>

<input
  type="url"
  value={editGameImageUrl}
  onChange={(e) => setEditGameImageUrl(e.target.value)}
  required
/>

                        <label>Nome da Empresa (Desenvolvedora)</label>
                        <input
                          type="text"
                          placeholder="Ex: Epic Games"
                          value={editGameCompanyName}
                          onChange={(e) => setEditGameCompanyName(e.target.value)}
                          required
                        />

                        <label>Contato da Empresa</label>
                        <input
                          type="text"
                          placeholder="Ex: suporte@empresa.com / site.com"
                          value={editGameContact}
                          onChange={(e) => setEditGameContact(e.target.value)}
                        />

                        <label>Descrição do jogo</label>
                        <textarea
                          className="developer-textarea"
                          value={editGameDescription}
                          onChange={(e) => setEditGameDescription(e.target.value)}
                          required
                        ></textarea>

                        <label>Fotos ou vídeos adicionais (Máximo: 5)</label>
                        <div>
                          {editMediaUrls.map((url, index) => (
                            <div key={index} className="dynamic-input-row">
                              <input
                                type="url"
                                placeholder="Cole a URL da imagem ou vídeo..."
                                value={url}
                                onChange={(e) => handleEditMediaChange(index, e.target.value)}
                              />
                              {editMediaUrls.length > 1 && (
                                <button
                                  type="button"
                                  className="btn-remove-input"
                                  onClick={() => handleRemoveEditMediaInput(index)}
                                >
                                  X
                                </button>
                              )}
                            </div>
                          ))}

                          {editMediaUrls.length < 5 && (
                            <button
                              type="button"
                              className="btn-add-input"
                              onClick={handleAddEditMediaInput}
                            >
                              + Adicionar mais um link
                            </button>
                          )}
                        </div>

                        <div className="edit-actions">
                          <button type="submit" className="btn-add-game">
                            Salvar alterações
                          </button>

                          <button
                            type="button"
                            className="btn-cancel-edit"
                            onClick={cancelEditGame}
                          >
                            Cancelar
                          </button>
                        </div>
                      </form>

                      {/* PRÉVIA AO VIVO DA EDIÇÃO */}
                      <div className="live-preview-box">
                        <h3 className="preview-title">Prévia da Edição</h3>
                        
                        <div className="details-main-card preview-mode">
                          <div className="details-image-section">
                            {editGameImageUrl ? (
                              <img src={editGameImageUrl} alt="Prévia do jogo" />
                            ) : (
                              <div style={{ backgroundColor: 'var(--bg-input)', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)' }}>
                                Capa do Jogo
                              </div>
                            )}

                            {editGameContact && (
                              <div className="game-contact-box">
                                <strong>Informações de Contato</strong>
                                <p style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap' }}>
                                  {editGameContact}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="details-info-section">
                            <h1>{editGameTitle || "Nome do Jogo"}</h1>

                            <h3 style={{ color: 'var(--accent-blue)', marginTop: '-10px', fontSize: '1.1rem', marginBottom: '20px' }}>
                              Desenvolvido por: {editGameCompanyName || "Sua Empresa"}
                            </h3>

                            <p className="game-description" style={{ minHeight: '60px' }}>
                              {editGameDescription || "A descrição do seu jogo aparecerá aqui..."}
                            </p>

                            {getAllMediaUrls(editGameImageUrl, editMediaUrls).length > 0 && (
                              <div className="media-gallery">
                                <h3 style={{ fontSize: '15px' }}>Fotos e vídeos do jogo</h3>
                                <div className="media-grid">
                                  {getAllMediaUrls(editGameImageUrl, editMediaUrls).map((url, index) => (
                                    <div key={index} className="media-box">
                                      {renderMedia(url, index)}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                )}
              </div>
            )}

            {page === 'profile' && (
              <div className="profile-container">
                <div className="profile-header-card">
                  <div className="avatar-circle">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>

                  <div className="user-info">
                    <h1>{user.user_metadata?.display_name || "Usuário"}</h1>
                    <p>{user.email}</p>

                    <span className={isDeveloper ? "role-badge developer" : "role-badge player"}>
                      {isDeveloper ? "Desenvolvedor" : "Jogador"}
                    </span>
                  </div>
                </div>

                <div className="stats-grid">
                  <div className="stat-card">
                    <p>Total de Avaliações</p>
                    <h2>{totalReviews}</h2>
                  </div>

                  <div className="stat-card">
                    <p>Média de Notas</p>
                    <h2>{averageRating}</h2>
                  </div>
                </div>

                <div className="user-reviews-section">
                  <h2>Minhas Avaliações</h2>
                  <hr className="title-divider" />

                  <div className="reviews-feed">
                    {userReviews.length > 0 ? (
                      userReviews.map(rev => (
                        <div key={rev.id} className="review-card">
                          <div className="review-header">
                            <strong>{rev.games?.title}</strong>

                            <div className="review-card-stars">
                              {[...Array(5)].map((_, i) => (
                                <span
                                  key={i}
                                  className={rev.rating > i ? "star-small active" : "star-small"}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                          </div>

                          <p className="review-card-comment">
                            {rev.comment ? `"${rev.comment}"` : "Sem comentário."}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="empty-state-card">
                        <p>Você ainda não fez nenhuma avaliação.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  )
}

export default App