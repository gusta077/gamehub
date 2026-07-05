import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabaseClient'
import './App.css'

function App() {
  const [page, setPage] = useState('login')
  const [isLogged, setIsLogged] = useState(false)
  const [user, setUser] = useState(null)

  const [games, setGames] = useState([])
  const [selectedGame, setSelectedGame] = useState(null)
  
  // ESTADO ADICIONADO PARA O CARROSSEL
  const [activeMediaIndex, setActiveMediaIndex] = useState(0)

  const [gameReviews, setGameReviews] = useState([])
  const [userReviews, setUserReviews] = useState([])
  const [communityReviews, setCommunityReviews] = useState([])
  
  // States da Aba de Notícias e Moderador
  const [newsList, setNewsList] = useState([])
  const [newNewsTitle, setNewNewsTitle] = useState('')
  const [newNewsContent, setNewNewsContent] = useState('')
  const [newNewsImage, setNewNewsImage] = useState('')
  const [questionTexts, setQuestionTexts] = useState({})
  const [modEmail, setModEmail] = useState('')

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
  const [newGameImageFileName, setNewGameImageFileName] = useState('')
  const [newGameCompanyName, setNewGameCompanyName] = useState('')
  const [newGameContact, setNewGameContact] = useState('')
  const [newGameDescription, setNewGameDescription] = useState('')
  const [newMediaUrls, setNewMediaUrls] = useState([''])
  const [newMediaFileNames, setNewMediaFileNames] = useState([''])

  // States Edição
  const [editingGame, setEditingGame] = useState(null)
  const [editGameTitle, setEditGameTitle] = useState('')
  const [editGameImageUrl, setEditGameImageUrl] = useState('')
  const [editGameImageFileName, setEditGameImageFileName] = useState('')
  const [editGameCompanyName, setEditGameCompanyName] = useState('')
  const [editGameContact, setEditGameContact] = useState('')
  const [editGameDescription, setEditGameDescription] = useState('')
  const [editMediaUrls, setEditMediaUrls] = useState([''])
  const [editMediaFileNames, setEditMediaFileNames] = useState([''])

  // ESTADOS PARA ALERTAS CUSTOMIZADOS ESTÉTICOS
  const [toast, setToast] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState(null)

  const newGameImageInputRef = useRef(null)
  const editGameImageInputRef = useRef(null)
  const newMediaInputRefs = useRef([])
  const editMediaInputRefs = useRef([])

  // VERIFICAÇÃO DE HIERARQUIA (SUPER ADMIN, MODERADOR, DESENVOLVEDOR)
  const isSuperAdmin = user?.email === 'gustavo022727@gmail.com'
  const isModerator = user?.user_metadata?.role === 'moderador' || isSuperAdmin
  const isDeveloper = user?.user_metadata?.role === 'developer' || isModerator

  // SISTEMA DE ALERTAS ESTÉTICOS
  function showToast(message, type = 'success') {
    setToast({ message, type })
    setTimeout(() => {
      setToast(null)
    }, 4000)
  }

  function showConfirm(message, action) {
    setConfirmDialog({ message, action })
  }

  // UPLOAD DO AVATAR DE PERFIL
  async function handleAvatarUpload(e) {
    const file = e.target.files[0]
    
    if (!file) return

    if (!file.type.startsWith("image/")) {
      showToast("Envie apenas arquivos de imagem para o perfil.", "error")
      return
    }

    const fileExt = file.name.split(".").pop()
    const fileName = `avatars/${user.id}_${Date.now()}.${fileExt}`

    showToast("Enviando foto...", "info")

    const { error } = await supabase.storage
      .from("game-images")
      .upload(fileName, file)

    if (error) {
      showToast("Erro ao enviar imagem: " + error.message, "error")
      return
    }

    const { data } = supabase.storage
      .from("game-images")
      .getPublicUrl(fileName)

    const { error: updateError } = await supabase.auth.updateUser({
      data: { avatar_url: data.publicUrl }
    })

    if (updateError) {
      showToast("Erro ao atualizar perfil: " + updateError.message, "error")
    } else {
      setUser({ ...user, user_metadata: { ...user.user_metadata, avatar_url: data.publicUrl } })
      showToast("Foto de perfil atualizada!", "success")
    }
  }

  // REMOVER AVATAR DE PERFIL
  function handleRemoveAvatar() {
    showConfirm("Tem certeza que deseja remover sua foto de perfil?", async () => {
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: null }
      })

      if (updateError) {
        showToast("Erro ao remover foto: " + updateError.message, "error")
      } else {
        setUser({ ...user, user_metadata: { ...user.user_metadata, avatar_url: null } })
        showToast("Foto de perfil removida!", "success")
      }
      setConfirmDialog(null)
    })
  }

  async function handleImageUpload(e, isEdit = false) {
    const file = e.target.files[0]

    if (!file) return

    if (!file.type.startsWith("image/")) {
      showToast("Envie apenas arquivos de imagem.", "error")
      e.target.value = ""
      return
    }

    const fileExt = file.name.split(".").pop()
    const fileName = `games/covers/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`

    const { error } = await supabase.storage
      .from("game-images")
      .upload(fileName, file)

    if (error) {
      showToast("Erro ao enviar imagem: " + error.message, "error")
      return
    }

    const { data } = supabase.storage
      .from("game-images")
      .getPublicUrl(fileName)

    if (isEdit) {
      setEditGameImageUrl(data.publicUrl)
      setEditGameImageFileName(file.name)
    } else {
      setNewGameImageUrl(data.publicUrl)
      setNewGameImageFileName(file.name)
    }

    showToast("Imagem enviada com sucesso!", "success")
  }

  function removeMainImageFile(isEdit = false) {
    if (isEdit) {
      setEditGameImageUrl('')
      setEditGameImageFileName('')

      if (editGameImageInputRef.current) {
        editGameImageInputRef.current.value = ''
      }
    } else {
      setNewGameImageUrl('')
      setNewGameImageFileName('')

      if (newGameImageInputRef.current) {
        newGameImageInputRef.current.value = ''
      }
    }
  }

  async function handleDynamicMediaUpload(e, index, isEdit = false) {
    const file = e.target.files[0]

    if (!file) return

    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      showToast("Envie apenas imagens ou vídeos.", "error")
      e.target.value = ""
      return
    }

    const fileExt = file.name.split(".").pop()
    const fileName = `games/media/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`

    const { error } = await supabase.storage
      .from("game-images")
      .upload(fileName, file)

    if (error) {
      showToast("Erro ao subir arquivo: " + error.message, "error")
      return
    }

    const { data } = supabase.storage
      .from("game-images")
      .getPublicUrl(fileName)

    if (isEdit) {
      const updatedUrls = [...editMediaUrls]
      updatedUrls[index] = data.publicUrl
      setEditMediaUrls(updatedUrls)

      const updatedFileNames = [...editMediaFileNames]
      updatedFileNames[index] = file.name
      setEditMediaFileNames(updatedFileNames)
    } else {
      const updatedUrls = [...newMediaUrls]
      updatedUrls[index] = data.publicUrl
      setNewMediaUrls(updatedUrls)

      const updatedFileNames = [...newMediaFileNames]
      updatedFileNames[index] = file.name
      setNewMediaFileNames(updatedFileNames)
    }

    showToast("Arquivo enviado com sucesso!", "success")
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user)
        setIsLogged(true)
        // Redireciona pro site direto se ele estava na tela de login/cadastro esperando confirmar email
        setPage((prev) => (prev === 'login' || prev === 'signup') ? 'catalog' : prev)
      } else {
        setUser(null)
        setIsLogged(false)
        setPage('login')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (isLogged) {
      fetchGames()
      fetchNews()
    }
  }, [isLogged])

  // FUNÇÕES DA ABA DE NOTÍCIAS E MODERAÇÃO
  async function fetchNews() {
    const { data, error } = await supabase
      .from('news')
      .select('*, news_questions(*)')
      .order('id', { ascending: false })
    
    if (!error && data) {
      setNewsList(data)
    }
  }

  async function handleAddNews(e) {
    e.preventDefault()
    if (!newNewsTitle.trim() || !newNewsContent.trim()) {
      showToast("Preencha título e conteúdo.", "error")
      return
    }
    const { error } = await supabase.from('news').insert([
      { title: newNewsTitle, content: newNewsContent, imageurl: newNewsImage, developer_id: user.id }
    ])
    if (error) {
      showToast("Erro ao postar notícia: " + error.message, "error")
    } else {
      showToast("Notícia publicada!", "success")
      setNewNewsTitle('')
      setNewNewsContent('')
      setNewNewsImage('')
      fetchNews()
    }
  }

  async function deleteNews(newsId) {
    showConfirm("Deseja apagar esta notícia?", async () => {
      const { error } = await supabase.from('news').delete().eq('id', newsId)
      if (error) { showToast("Erro: " + error.message, "error") } 
      else { showToast("Notícia removida!", "success"); fetchNews(); }
      setConfirmDialog(null)
    })
  }

  async function handleAskQuestion(newsId) {
    const text = questionTexts[newsId]
    if (!text || !text.trim()) {
      showToast("Digite uma pergunta.", "error")
      return
    }
    const { error } = await supabase.from('news_questions').insert([
      { news_id: newsId, user_id: user.id, user_email: user.email, question: text }
    ])
    if (error) {
      showToast("Erro ao enviar: " + error.message, "error")
    } else {
      showToast("Pergunta enviada!", "success")
      setQuestionTexts(prev => ({ ...prev, [newsId]: '' }))
      fetchNews()
    }
  }

  async function handleGrantModerator(e) {
    e.preventDefault()
    if (!modEmail.trim()) return
    
    showConfirm(`Deseja promover ${modEmail} a Moderador?`, async () => {
      const { error } = await supabase.rpc('grant_moderator_role', { target_email: modEmail })
      if (error) {
        showToast("Erro ao promover: " + error.message, "error")
      } else {
        showToast(`Usuário ${modEmail} promovido a moderador com sucesso!`, "success")
        setModEmail('')
      }
      setConfirmDialog(null)
    })
  }

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
    setActiveMediaIndex(0) // RESETA O CARROSSEL PARA A PRIMEIRA IMAGEM

    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('game_id', game.id)
      .order('id', { ascending: false })

    if (error) {
      showToast(error.message, "error")
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
      showToast(error.message, "error")
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
      showToast(error.message, "error")
    } else {
      setCommunityReviews(data || [])
    }
  }

  async function openDeveloperArea() {
    if (!isDeveloper) {
      showToast("Apenas contas de desenvolvedor podem acessar essa área.", "error")
      return
    }

    setPage('developer')
    setEditingGame(null)
    await fetchDeveloperGames()
  }

  async function fetchDeveloperGames() {
    if (!user) return

    let query = supabase
      .from('games')
      .select('*')
      .order('id', { ascending: false })

    // Se não for moderador, lista apenas os jogos criados pelo usuário
    if (!isModerator) {
      query = query.eq('developer_id', user.id)
    }

    const { data, error } = await query

    if (error) {
      showToast(error.message, "error")
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
      showToast(error.message, "error")
    } else {
      setUser(data.user)
      setIsLogged(true)
      setPage('catalog')
      showToast("Login efetuado com sucesso!", "success")
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
      showToast(error.message, "error")
    } else {
      showToast("Cadastro realizado com sucesso! Verifique seu email e após isso aguarde, você será logado.", "success")
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
      showToast("Selecione uma nota!", "error")
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
      showToast(error.message, "error")
    } else {
      showToast("Avaliação enviada!", "success")
      setReviewText('')
      setRating(0)
      openGameDetails(selectedGame)
    }
  }

  // APAGAR AVALIAÇÕES (MODERADOR OU DONO DA REVIEW)
  async function deleteReview(reviewId) {
    showConfirm("Deseja realmente apagar esta avaliação?", async () => {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId)

      if (error) {
        showToast("Erro ao apagar avaliação: " + error.message, "error")
      } else {
        showToast("Avaliação apagada com sucesso!", "success")
        if (page === 'details') openGameDetails(selectedGame)
        if (page === 'community') openCommunityReviews()
        if (page === 'profile') openProfile()
      }
      setConfirmDialog(null)
    })
  }

  function handleNewMediaChange(index, value) {
    const updatedUrls = [...newMediaUrls]
    updatedUrls[index] = value
    setNewMediaUrls(updatedUrls)

    const updatedFileNames = [...newMediaFileNames]
    updatedFileNames[index] = ''
    setNewMediaFileNames(updatedFileNames)

    if (newMediaInputRefs.current[index]) {
      newMediaInputRefs.current[index].value = ''
    }
  }

  function handleAddNewMediaInput() {
    if (newMediaUrls.length < 5) {
      setNewMediaUrls([...newMediaUrls, ''])
      setNewMediaFileNames([...newMediaFileNames, ''])
    }
  }

  function handleRemoveNewMediaInput(index) {
    const updatedUrls = newMediaUrls.filter((_, i) => i !== index)
    const updatedFileNames = newMediaFileNames.filter((_, i) => i !== index)

    setNewMediaUrls(updatedUrls.length > 0 ? updatedUrls : [''])
    setNewMediaFileNames(updatedFileNames.length > 0 ? updatedFileNames : [''])
  }

  function handleEditMediaChange(index, value) {
    const updatedUrls = [...editMediaUrls]
    updatedUrls[index] = value
    setEditMediaUrls(updatedUrls)

    const updatedFileNames = [...editMediaFileNames]
    updatedFileNames[index] = ''
    setEditMediaFileNames(updatedFileNames)

    if (editMediaInputRefs.current[index]) {
      editMediaInputRefs.current[index].value = ''
    }
  }

  function handleAddEditMediaInput() {
    if (editMediaUrls.length < 5) {
      setEditMediaUrls([...editMediaUrls, ''])
      setEditMediaFileNames([...editMediaFileNames, ''])
    }
  }

  function handleRemoveEditMediaInput(index) {
    const updatedUrls = editMediaUrls.filter((_, i) => i !== index)
    const updatedFileNames = editMediaFileNames.filter((_, i) => i !== index)

    setEditMediaUrls(updatedUrls.length > 0 ? updatedUrls : [''])
    setEditMediaFileNames(updatedFileNames.length > 0 ? updatedFileNames : [''])
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

  function renderMedia(url, index, isThumbnail = false) {
    const youtubeUrl = getYoutubeEmbedUrl(url)

    if (youtubeUrl) {
      if (isThumbnail) {
        const videoId = youtubeUrl.split('/embed/')[1]
        return (
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <img src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`} alt="Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', color: 'white', fontSize: '24px' }}>
              ▶
            </div>
          </div>
        )
      }
      return (
        <iframe
          src={youtubeUrl}
          title={`Vídeo do jogo ${index + 1}`}
          style={{ width: '100%', height: '100%', border: 'none' }}
          allowFullScreen
        ></iframe>
      )
    }

    if (isVideoUrl(url)) {
      if (isThumbnail) {
        return (
          <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000' }}>
            <video src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', color: 'white', fontSize: '24px' }}>
              ▶
            </div>
          </div>
        )
      }
      return (
        <video controls style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#000' }}>
          <source src={url} />
          Seu navegador não suporta vídeo.
        </video>
      )
    }

    return (
      <img
        src={url}
        alt={`Mídia do jogo ${index + 1}`}
        style={{ width: '100%', height: '100%', objectFit: isThumbnail ? 'cover' : 'contain', backgroundColor: '#000' }}
      />
    )
  }

  async function addGame(e) {
    e.preventDefault()

    if (!isDeveloper) {
      showToast("Apenas desenvolvedores podem adicionar jogos.", "error")
      return
    }

    if (!newGameTitle.trim() || !newGameCompanyName.trim()) {
      showToast("Preencha o nome do jogo e da desenvolvedora.", "error")
      return
    }

    if (!newGameImageUrl.trim()) {
      showToast("Coloque a URL da imagem principal.", "error")
      return
    }

    if (!newGameDescription.trim()) {
      showToast("Digite uma descrição para o jogo.", "error")
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
      showToast(error.message, "error")
    } else {
      showToast("Jogo adicionado com sucesso!", "success")

      setNewGameTitle('')
      setNewGameImageUrl('')
      setNewGameImageFileName('')
      setNewGameDescription('')
      setNewGameCompanyName('')
      setNewGameContact('')
      setNewMediaUrls([''])
      setNewMediaFileNames([''])

      if (newGameImageInputRef.current) {
        newGameImageInputRef.current.value = ''
      }

      newMediaInputRefs.current.forEach(input => {
        if (input) input.value = ''
      })

      await fetchGames()
      await fetchDeveloperGames()
    }
  }

  function startEditGame(game) {
    setEditingGame(game)

    setEditGameTitle(game.title || '')
    setEditGameImageUrl(game.imageurl || '')
    setEditGameImageFileName('')
    setEditGameDescription(game.description || '')
    setEditGameCompanyName(game.company_name || '')
    setEditGameContact(game.company_contact || '')

    const mediaWithoutMainImage = game.media_urls
      ? game.media_urls.filter(url => url !== game.imageurl)
      : []

    setEditMediaUrls(mediaWithoutMainImage.length > 0 ? mediaWithoutMainImage : [''])
    setEditMediaFileNames(mediaWithoutMainImage.length > 0 ? mediaWithoutMainImage.map(() => '') : [''])

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
    setEditGameImageFileName('')
    setEditGameDescription('')
    setEditGameCompanyName('')
    setEditGameContact('')
    setEditMediaUrls([''])
    setEditMediaFileNames([''])

    if (editGameImageInputRef.current) {
      editGameImageInputRef.current.value = ''
    }

    editMediaInputRefs.current.forEach(input => {
      if (input) input.value = ''
    })
  }

  async function updateGame(e) {
    e.preventDefault()

    if (!editingGame) return

    if (!editGameTitle.trim() || !editGameCompanyName.trim()) {
      showToast("Preencha o nome do jogo e da desenvolvedora.", "error")
      return
    }

    if (!editGameImageUrl.trim()) {
      showToast("Coloque a URL da imagem principal.", "error")
      return
    }

    if (!editGameDescription.trim()) {
      showToast("Digite uma descrição para o jogo.", "error")
      return
    }

    const mediaUrls = getAllMediaUrls(editGameImageUrl, editMediaUrls)

    let query = supabase
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

    // Apenas garante que seja dono se não for moderador
    if (!isModerator) {
      query = query.eq('developer_id', user.id)
    }

    const { error } = await query

    if (error) {
      showToast(error.message, "error")
    } else {
      showToast("Jogo atualizado com sucesso!", "success")

      cancelEditGame()
      await fetchGames()
      await fetchDeveloperGames()
    }
  }

  async function deleteGame(gameId) {
    showConfirm("Tem certeza que deseja apagar este jogo? As avaliações vinculadas a ele também serão perdidas.", async () => {
      await supabase
        .from('reviews')
        .delete()
        .eq('game_id', gameId)

      let query = supabase
        .from('games')
        .delete()
        .eq('id', gameId)

      if (!isModerator) {
        query = query.eq('developer_id', user.id)
      }

      const { error } = await query

      if (error) {
        showToast("Erro ao apagar o jogo: " + error.message, "error")
      } else {
        showToast("Jogo apagado com sucesso!", "success")
        
        if (editingGame?.id === gameId) {
          cancelEditGame()
        }
        
        await fetchGames()
        await fetchDeveloperGames()
      }
      setConfirmDialog(null)
    })
  }

  const totalReviews = userReviews.length

  const averageRating = totalReviews > 0
    ? (userReviews.reduce((acc, rev) => acc + rev.rating, 0) / totalReviews).toFixed(1)
    : "0.0"

  const gameMedia = selectedGame ? Array.from(new Set([selectedGame.imageurl, ...(selectedGame.media_urls || [])].filter(Boolean))) : []

  return (
    <div id="app">
      {/* OVERLAYS DE ALERTAS CUSTOMIZADOS */}
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999,
          background: toast.type === 'error' ? '#ef4444' : toast.type === 'info' ? '#3b82f6' : '#10b981',
          color: 'white', padding: '12px 24px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          {toast.message}
        </div>
      )}

      {confirmDialog && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: '#1e293b', padding: '30px', borderRadius: '12px', maxWidth: '400px', width: '90%',
            textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
          }}>
            <h3 style={{ color: 'white', marginBottom: '15px', fontSize: '1.25rem' }}>Atenção</h3>
            <p style={{ color: '#cbd5e1', marginBottom: '25px', lineHeight: '1.5' }}>{confirmDialog.message}</p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button onClick={() => setConfirmDialog(null)} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #475569', background: 'transparent', color: '#cbd5e1', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
              <button onClick={confirmDialog.action} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

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
              <span onClick={() => setPage('news')}>
                Notícias
              </span>

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
            
            {/* ABA DE NOTÍCIAS COM PREVIEW E ESTILIZAÇÃO STEAM */}
            {page === 'news' && (
              <div className="catalog-wrapper">
                <h1>Notícias e Atualizações</h1>

                {/* FORMULÁRIO DE CRIAR NOTÍCIA COM PREVIEW (SÓ PARA DESENVOLVEDOR/MODERADOR) */}
                {isDeveloper && (
                  <div className="developer-card" style={{ marginBottom: '30px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    
                    <div style={{ flex: '1', minWidth: '300px' }}>
                      <h2>Publicar Nova Notícia</h2>
                      <form onSubmit={handleAddNews} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <input type="text" placeholder="Título da notícia" value={newNewsTitle} onChange={(e) => setNewNewsTitle(e.target.value)} required style={{ background: '#1b2838', border: '1px solid #3d4450', color: 'white' }} />
                        <input type="url" placeholder="URL da imagem (opcional)" value={newNewsImage} onChange={(e) => setNewNewsImage(e.target.value)} style={{ background: '#1b2838', border: '1px solid #3d4450', color: 'white' }} />
                        <textarea className="developer-textarea" placeholder="Conteúdo da notícia..." value={newNewsContent} onChange={(e) => setNewNewsContent(e.target.value)} required style={{ background: '#1b2838', border: '1px solid #3d4450', color: 'white', minHeight: '150px' }}></textarea>
                        <button type="submit" style={{ alignSelf: 'flex-start', background: '#10b981', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Publicar Notícia</button>
                      </form>
                    </div>

                    {/* PRÉVIA DA NOTÍCIA */}
                    <div style={{ flex: '1', minWidth: '300px', borderLeft: '1px solid #2a3f5a', paddingLeft: '20px' }}>
                      <h3 style={{ color: '#67c1f5', marginTop: 0, marginBottom: '15px' }}>Prévia da Notícia</h3>
                      <div className="news-card" style={{ background: 'transparent', padding: 0, boxShadow: 'none' }}>
                        <h3 style={{ margin: '0 0 5px 0', color: 'white', fontSize: '1.2rem' }}>{newNewsTitle || "Título de Exemplo"}</h3>
                        <div style={{ fontSize: '12px', color: '#acb2b8', marginBottom: '10px' }}>Hoje</div>
                        
                        {newNewsImage ? (
                          <img src={newNewsImage} alt="Capa da Prévia" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '4px', marginBottom: '10px' }} />
                        ) : (
                          <div style={{ width: '100%', height: '150px', background: '#1b2838', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3d4450', marginBottom: '10px' }}>Imagem da Notícia</div>
                        )}
                        
                        <div style={{ color: '#c6d4df', fontSize: '14px', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                          {newNewsContent || "O conteúdo da sua notícia aparecerá aqui."}
                        </div>
                      </div>
                    </div>

                  </div>
                )}

                {/* CABEÇALHO DE FILTRO INSPIRADO NA STEAM */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: '#1b2838', padding: '10px 20px', borderRadius: '4px', marginBottom: '20px', border: '1px solid #2a3f5a' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#67c1f5' }}>EXIBIR</span>
                  <select style={{ background: '#3d4450', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer' }}>
                    <option>TODAS AS NOTÍCIAS</option>
                  </select>
                  <button style={{ background: '#3d4450', color: 'white', border: 'none', padding: '5px 15px', borderRadius: '3px', cursor: 'pointer', fontSize: '13px' }}>Seguir (?)</button>
                </div>

                {/* GRID DE NOTÍCIAS COM OS CARDS */}
                <div className="news-feed" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {newsList.length > 0 ? (
                    newsList.map(news => (
                      <div key={news.id} style={{ background: '#171a21', padding: '20px', borderRadius: '4px', position: 'relative' }}>
                        
                        {/* BOTÃO DE EXCLUIR (Apenas para o autor ou moderador) */}
                        {(isModerator || news.developer_id === user.id) && (
                          <button 
                            onClick={() => deleteNews(news.id)} 
                            style={{ position: 'absolute', top: '20px', right: '20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '3px', padding: '5px 15px', cursor: 'pointer', zIndex: 10, fontSize: '12px', fontWeight: 'bold' }}
                          >
                            Excluir
                          </button>
                        )}
                        
                        {/* TÍTULO E DATA DA NOTÍCIA */}
                        <h2 style={{ color: 'white', margin: '0 0 5px 0', fontSize: '1.5rem', paddingRight: '80px' }}>{news.title}</h2>
                        <div style={{ fontSize: '13px', color: '#acb2b8', marginBottom: '15px' }}>
                          {new Date(news.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', '')}
                        </div>
                        
                        {/* CONTEÚDO E IMAGEM */}
                        <div style={{ color: '#c6d4df', fontSize: '14px', lineHeight: '1.6', marginBottom: '15px', whiteSpace: 'pre-wrap' }}>
                          {news.content}
                        </div>
                        {news.imageurl && (
                          <img src={news.imageurl} alt="Capa da Notícia" style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: '4px', marginBottom: '15px' }} />
                        )}

                        {/* RODAPÉ DO CARD DA STEAM */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '20px', color: '#acb2b8', fontSize: '13px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '24px', height: '24px', background: '#3d4450', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>G</div>
                            <span>GameHub News</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span>💬 {news.news_questions ? news.news_questions.length : 0}</span>
                          </div>
                        </div>

                        {/* SEÇÃO DE PERGUNTAS */}
                        <div style={{ marginTop: '20px', borderTop: '1px solid #2a3f5a', paddingTop: '15px' }}>
                          <h4 style={{ fontSize: '14px', margin: '0 0 15px 0', color: '#67c1f5' }}>Perguntas da Comunidade</h4>
                          
                          <div className="questions-section" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' }}>
                            {news.news_questions && news.news_questions.length > 0 ? (
                              news.news_questions.map(q => (
                                <div key={q.id} style={{ background: '#1b2838', padding: '12px', borderRadius: '4px', fontSize: '13px', borderLeft: '3px solid #67c1f5' }}>
                                  <strong style={{ color: '#acb2b8', display: 'block', marginBottom: '5px' }}>{q.user_email.split('@')[0]}:</strong> 
                                  <p style={{ margin: 0, color: '#c6d4df', lineHeight: '1.4' }}>{q.question}</p>
                                </div>
                              ))
                            ) : (
                              <p style={{ color: '#8f98a0', fontSize: '13px', margin: 0, fontStyle: 'italic' }}>Nenhuma pergunta registrada. Compartilhe sua dúvida!</p>
                            )}
                          </div>

                          {/* INPUT PARA ENVIAR PERGUNTA (DISPONÍVEL PARA TODOS LOGADOS) */}
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <input 
                              type="text" 
                              placeholder="Escreva sua pergunta..." 
                              value={questionTexts[news.id] || ''} 
                              onChange={(e) => setQuestionTexts({ ...questionTexts, [news.id]: e.target.value })} 
                              style={{ flex: 1, margin: 0, padding: '10px 15px', fontSize: '13px', background: '#1b2838', border: '1px solid #3d4450', color: 'white', borderRadius: '4px' }} 
                            />
                            <button 
                              onClick={() => handleAskQuestion(news.id)} 
                              style={{ background: '#3d4450', color: 'white', border: 'none', padding: '0 25px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', transition: 'background 0.2s' }}
                              onMouseOver={(e) => e.target.style.background = '#4a5361'}
                              onMouseOut={(e) => e.target.style.background = '#3d4450'}
                            >
                              Enviar
                            </button>
                          </div>
                        </div>
                        
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#8f98a0', background: '#1b2838', borderRadius: '4px' }}>
                      Nenhuma notícia foi publicada ainda.
                    </div>
                  )}
                </div>
              </div>
            )}

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

                <div className="details-main-card" style={{ gap: '20px' }}>
                  <div className="details-image-section" style={{ flex: '1.5', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                    
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden' }}>
                      {gameMedia.length > 1 && (
                        <button 
                          onClick={() => setActiveMediaIndex(prev => prev === 0 ? gameMedia.length - 1 : prev - 1)} 
                          style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '50px', background: 'linear-gradient(to right, rgba(0,0,0,0.8), transparent)', color: 'white', border: 'none', fontSize: '3rem', cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          &#10094;
                        </button>
                      )}

                      {renderMedia(gameMedia[activeMediaIndex], activeMediaIndex, false)}

                      {gameMedia.length > 1 && (
                        <button 
                          onClick={() => setActiveMediaIndex(prev => prev === gameMedia.length - 1 ? 0 : prev + 1)} 
                          style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '50px', background: 'linear-gradient(to left, rgba(0,0,0,0.8), transparent)', color: 'white', border: 'none', fontSize: '3rem', cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          &#10095;
                        </button>
                      )}
                    </div>

                    {gameMedia.length > 1 && (
                      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginTop: '10px' }}>
                        {gameMedia.map((url, idx) => (
                          <div
                            key={idx}
                            onClick={() => setActiveMediaIndex(idx)}
                            style={{
                              width: '120px',
                              height: '68px',
                              flexShrink: 0,
                              cursor: 'pointer',
                              border: activeMediaIndex === idx ? '2px solid var(--accent-blue, #3b82f6)' : '2px solid transparent',
                              opacity: activeMediaIndex === idx ? 1 : 0.5,
                              transition: 'opacity 0.2s, border 0.2s',
                              borderRadius: '4px',
                              overflow: 'hidden',
                              backgroundColor: '#000'
                            }}
                          >
                            {renderMedia(url, idx, true)}
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedGame.company_contact && (
                      <div className="game-contact-box" style={{ marginTop: '20px' }}>
                        <strong>Informações de Contato</strong>
                        <p style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap' }}>
                          {selectedGame.company_contact}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="details-info-section" style={{ flex: '1' }}>
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

                    <p className="form-subtitle" style={{ marginTop: '30px' }}>
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
                        <div key={rev.id} className="review-card" style={{ position: 'relative' }}>
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

                          {(isModerator || rev.user_id === user.id) && (
                            <button
                              onClick={() => deleteReview(rev.id)}
                              style={{ position: 'absolute', top: '10px', right: '10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}
                            >
                              Excluir
                            </button>
                          )}
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
                        <div key={rev.id} className="review-card" style={{ position: 'relative' }}>
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

                          {(isModerator || rev.user_id === user.id) && (
                            <button
                              onClick={() => deleteReview(rev.id)}
                              style={{ position: 'absolute', bottom: '10px', right: '10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}
                            >
                              Excluir
                            </button>
                          )}
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
                  <h1>{isModerator ? "Painel de Administração" : "Área do Desenvolvedor"}</h1>
                  <p>
                    Cadastre, edite e gerencie os jogos que você adicionou ao GameHub.
                  </p>
                </div>

                {/* PAINEL DE PROMOÇÃO DE MODERADOR (SÓ APARECE PARA MODERADORES) */}
                {isModerator && (
                  <div className="developer-card" style={{ border: '2px solid var(--accent-blue)' }}>
                    <h2>Promover usuário a Moderador</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '15px' }}>Digite o e-mail exato do usuário para conceder os poderes de moderação global e postagem de notícias.</p>
                    <form onSubmit={handleGrantModerator} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <input type="email" placeholder="E-mail do usuário..." value={modEmail} onChange={(e) => setModEmail(e.target.value)} style={{ flex: 1, minWidth: '200px' }} required />
                      <button type="submit" className="btn-add-game" style={{ margin: 0 }}>Promover</button>
                    </form>
                  </div>
                )}

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

                      <div className="custom-file-area">
                        <input
                          ref={newGameImageInputRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, false)}
                          className="hidden-file-input"
                        />

                        <button
                          type="button"
                          className="btn-file-select"
                          onClick={() => newGameImageInputRef.current?.click()}
                        >
                          Escolher imagem
                        </button>

                        <span className="file-name-text">
                          {newGameImageFileName || "Nenhuma imagem escolhida"}
                        </span>

                        {(newGameImageUrl || newGameImageFileName) && (
                          <button
                            type="button"
                            className="btn-remove-file"
                            onClick={() => removeMainImageFile(false)}
                          >
                            Remover imagem
                          </button>
                        )}
                      </div>

                      <input
                        type="url"
                        placeholder="https://exemplo.com/capa.jpg"
                        value={newGameImageUrl}
                        onChange={(e) => {
                          setNewGameImageUrl(e.target.value)
                          setNewGameImageFileName('')

                          if (newGameImageInputRef.current) {
                            newGameImageInputRef.current.value = ''
                          }
                        }}
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
                          <div key={index} className="dynamic-input-row">
                            <label>Enviar imagem ou vídeo</label>

                            <div className="custom-file-area">
                              <input
                                ref={(el) => { newMediaInputRefs.current[index] = el }}
                                type="file"
                                accept="image/*,video/*"
                                onChange={(e) => handleDynamicMediaUpload(e, index, false)}
                                className="hidden-file-input"
                              />

                              <button
                                type="button"
                                className="btn-file-select"
                                onClick={() => newMediaInputRefs.current[index]?.click()}
                              >
                                Escolher arquivo
                              </button>

                              <span className="file-name-text">
                                {newMediaFileNames[index] || "Nenhum arquivo escolhido"}
                              </span>
                            </div>

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
                            + Adicionar mais uma mídia
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
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                <div className="developer-card developer-list-card">
                  <h2>{isModerator ? "Gerenciamento Global (Todos os Jogos)" : "Meus jogos adicionados"}</h2>

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

                        <div className="custom-file-area">
                          <input
                            ref={editGameImageInputRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, true)}
                            className="hidden-file-input"
                          />

                          <button
                            type="button"
                            className="btn-file-select"
                            onClick={() => editGameImageInputRef.current?.click()}
                          >
                            Escolher imagem
                          </button>

                          <span className="file-name-text">
                            {editGameImageFileName || "Nenhuma imagem escolhida"}
                          </span>

                          {(editGameImageUrl || editGameImageFileName) && (
                            <button
                              type="button"
                              className="btn-remove-file"
                              onClick={() => removeMainImageFile(true)}
                            >
                              Remover imagem
                            </button>
                          )}
                        </div>

                        <input
                          type="url"
                          placeholder="https://exemplo.com/capa.jpg"
                          value={editGameImageUrl}
                          onChange={(e) => {
                            setEditGameImageUrl(e.target.value)
                            setEditGameImageFileName('')

                            if (editGameImageInputRef.current) {
                              editGameImageInputRef.current.value = ''
                            }
                          }}
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
                              <label>Enviar imagem ou vídeo</label>

                              <div className="custom-file-area">
                                <input
                                  ref={(el) => { editMediaInputRefs.current[index] = el }}
                                  type="file"
                                  accept="image/*,video/*"
                                  onChange={(e) => handleDynamicMediaUpload(e, index, true)}
                                  className="hidden-file-input"
                                />

                                <button
                                  type="button"
                                  className="btn-file-select"
                                  onClick={() => editMediaInputRefs.current[index]?.click()}
                                >
                                  Escolher arquivo
                                </button>

                                <span className="file-name-text">
                                  {editMediaFileNames[index] || "Nenhum arquivo escolhido"}
                                </span>
                              </div>

                              <label>Ou cole um link</label>

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
                                  Remover
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
                              + Adicionar mais uma mídia
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
                  
                  {/* UPLOAD E REMOÇÃO DE AVATAR */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <div 
                      className="avatar-circle" 
                      style={{ 
                        position: 'relative', 
                        overflow: 'hidden', 
                        backgroundImage: `url(${user?.user_metadata?.avatar_url})`, 
                        backgroundSize: 'cover', 
                        backgroundPosition: 'center', 
                        backgroundColor: '#1e293b' 
                      }}
                    >
                      {!user?.user_metadata?.avatar_url && (
                        <svg viewBox="0 0 24 24" fill="none">
                          <path
                            d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                          <path
                            d="M20 21C20 17.134 16.4183 14 12 14C7.58172 14 4 17.134 4 21"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      )}
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleAvatarUpload} 
                        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} 
                        title="Clique para mudar a foto de perfil"
                      />
                    </div>
                    {user?.user_metadata?.avatar_url && (
                      <button 
                        onClick={handleRemoveAvatar}
                        style={{ background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
                      >
                        Remover Foto
                      </button>
                    )}
                  </div>

                  <div className="user-info">
                    <h1>{user?.user_metadata?.display_name || "Usuário"}</h1>
                    <p>{user?.email}</p>

                    <span className={isModerator ? "role-badge developer" : isDeveloper ? "role-badge developer" : "role-badge player"}>
                      {isModerator ? "Moderador" : isDeveloper ? "Desenvolvedor" : "Jogador"}
                    </span>
                  </div>
                </div>

                <div className="stats-grid">
                  <div className="stat-card">
                    <p>Total de avaliações feitas</p>
                    <h2>{totalReviews}</h2>
                  </div>

                  <div className="stat-card">
                    <p>Média das suas notas</p>
                    <h2>{averageRating}</h2>
                  </div>
                </div>

                <div className="user-reviews-section">
                  <h2>Minhas avaliações</h2>

                  <div className="reviews-feed">
                    {userReviews.length > 0 ? (
                      userReviews.map(rev => (
                        <div key={rev.id} className="review-card" style={{ position: 'relative' }}>
                          <div className="review-header">
                            <div>
                              <strong>{rev.games?.title || "Jogo desconhecido"}</strong>
                              <p className="review-card-meta">
                                Avaliado por você
                              </p>
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

                          <button
                            onClick={() => deleteReview(rev.id)}
                            style={{ position: 'absolute', bottom: '10px', right: '10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}
                          >
                            Excluir
                          </button>
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