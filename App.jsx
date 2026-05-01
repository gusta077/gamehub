import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import './index.css'

function App() {
  const [page, setPage] = useState('login')
  const [isLogged, setIsLogged] = useState(false)
  const [user, setUser] = useState(null)
  const [games, setGames] = useState([])
  const [selectedGame, setSelectedGame] = useState(null)
  const [gameReviews, setGameReviews] = useState([])
  const [rating, setRating] = useState(0)
  const [reviewText, setReviewText] = useState('')

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
    if (isLogged) fetchGames()
  }, [isLogged])

  async function fetchGames() {
    const { data, error } = await supabase.from('games').select('*')
    if (data && data.length > 0) {
      setGames(data)
    } else if (!error) {
      await seedDatabase()
    }
  }

  async function seedDatabase() {
    const initialGames = [
      { title: "Counter-Strike 2", imageurl: "https://cdn.akamai.steamstatic.com/steam/apps/730/header.jpg" },
      { title: "Elden Ring", imageurl: "https://cdn.akamai.steamstatic.com/steam/apps/1245620/header.jpg" },
      { title: "Forza Horizon 5", imageurl: "https://cdn.akamai.steamstatic.com/steam/apps/1551360/header.jpg" },
      { title: "God of War", imageurl: "https://cdn.akamai.steamstatic.com/steam/apps/1593500/header.jpg" },
      { title: "Grand Theft Auto V", imageurl: "https://cdn.akamai.steamstatic.com/steam/apps/271590/header.jpg" },
      { title: "Hollow Knight", imageurl: "https://cdn.akamai.steamstatic.com/steam/apps/367520/header.jpg" },
      { title: "Red Dead Redemption 2", imageurl: "https://cdn.akamai.steamstatic.com/steam/apps/1174180/header.jpg" },
      { title: "Resident Evil 4", imageurl: "https://cdn.akamai.steamstatic.com/steam/apps/2050650/header.jpg" },
      { title: "The Last of Us Part I", imageurl: "https://cdn.akamai.steamstatic.com/steam/apps/1888930/header.jpg" },
      { title: "The Witcher 3: Wild Hunt", imageurl: "https://cdn.akamai.steamstatic.com/steam/apps/292030/header.jpg" }
    ]
    await supabase.from('games').insert(initialGames)
    fetchGames()
  }

  async function openGameDetails(game) {
    setSelectedGame(game)
    setPage('details')
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('game_id', game.id)
      .order('id', { ascending: false })
    setGameReviews(data || [])
  }

  async function handleLogin(e) {
    e.preventDefault()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: e.target[0].value,
      password: e.target[1].value
    })
    if (error) alert(error.message)
    else {
      setUser(data.user)
      setIsLogged(true)
      setPage('catalog')
    }
  }

  async function handleSignup(e) {
    e.preventDefault()
    const { error } = await supabase.auth.signUp({
      email: e.target[1].value,
      password: e.target[2].value,
      options: { data: { display_name: e.target[0].value } }
    })
    if (error) alert(error.message)
    else {
      alert("Cadastro realizado!")
      setPage('login')
    }
  }

  async function sendReview() {
    if (rating === 0) return alert("Selecione uma nota!")
    const { error } = await supabase.from('reviews').insert([
      {
        game_id: selectedGame.id,
        user_id: user.id,
        user_email: user.email,
        rating: rating,
        comment: reviewText
      }
    ])
    if (error) alert(error.message)
    else {
      alert("Avaliação enviada!")
      setReviewText('')
      setRating(0)
      openGameDetails(selectedGame)
    }
  }

  return (
    <div id="app">
      {!isLogged ? (
        <div className="auth-container">
          <div className="form-box">
            <h2>GameHub</h2>
            {page === 'login' ? (
              <form onSubmit={handleLogin}>
                <input type="email" placeholder="Email" required />
                <input type="password" placeholder="Senha" required />
                <button type="submit" className="btn-auth">Entrar</button>
                <p>Não tem conta? <a href="#" onClick={() => setPage('signup')}>Cadastre-se</a></p>
              </form>
            ) : (
              <form onSubmit={handleSignup}>
                <input type="text" placeholder="Nome" required />
                <input type="email" placeholder="Email" required />
                <input type="password" placeholder="Senha" required />
                <button type="submit" className="btn-auth signup">Cadastrar</button>
                <p>Já tem conta? <a href="#" onClick={() => setPage('login')}>Login</a></p>
              </form>
            )}
          </div>
        </div>
      ) : (
        <div id="main-layout">
          <header className="navbar">
            <div className="nav-brand" onClick={() => setPage('catalog')}>GameHub</div>
            <nav className="nav-links">
              <span onClick={() => setPage('catalog')}>Catálogo</span>
              <span>Reviews da Comunidade</span>
              <span>Perfil</span>
              <button onClick={() => setIsLogged(false)} className="btn-exit">Sair</button>
            </nav>
          </header>

          <main className="content">
            {page === 'catalog' && (
              <div className="catalog-wrapper">
                <h1>Catálogo de Jogos</h1>
                <hr className="title-divider" />
                <div className="game-grid">
                  {games.map(game => (
                    <div key={game.id} className="game-card" onClick={() => openGameDetails(game)}>
                      <img src={game.imageurl} alt={game.title} />
                      <div className="game-title-bar">{game.title}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {page === 'details' && selectedGame && (
              <div className="details-wrapper">
                <button className="btn-back" onClick={() => setPage('catalog')}>← Voltar ao Catálogo</button>
                
                <div className="details-main-card">
                  <div className="details-image-section">
                    <img src={selectedGame.imageurl} alt={selectedGame.title} />
                  </div>
                  <div className="details-info-section">
                    <h1>{selectedGame.title}</h1>
                    <p className="form-subtitle">Deixe sua avaliação para este jogo.</p>
                    <div className="star-input-container">
                      {[1, 2, 3, 4, 5].map(num => (
                        <span 
                          key={num} 
                          className={rating >= num ? "star-input active" : "star-input"} 
                          onClick={() => setRating(num)}
                        >★</span>
                      ))}
                    </div>
                    <textarea 
                      className="review-textarea"
                      placeholder="Sua análise (opcional)" 
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                    ></textarea>
                    <button onClick={sendReview} className="btn-submit-review">ENVIAR AVALIAÇÃO</button>
                  </div>
                </div>

                <div className="community-section">
                  <h2 className="community-title">Avaliações da Comunidade</h2>
                  <div className="reviews-feed">
                    {gameReviews.length > 0 ? (
                      gameReviews.map(rev => (
                        <div key={rev.id} className="review-card">
                          <div className="review-card-stars">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={rev.rating > i ? "star-small active" : "star-small"}>★</span>
                            ))}
                          </div>
                          <p className="review-card-comment">"{rev.comment}"</p>
                          <p className="review-card-meta">Avaliado por: {rev.user_email}</p>
                        </div>
                      ))
                    ) : (
                      <p className="empty-reviews">Nenhuma avaliação ainda. Seja o primeiro!</p>
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