import express from 'express'
import crypto from 'node:crypto'
import movies from './movies.json' with {type:'json'}
import{validateMovie, validateParcialMovie } from './schemas/movies.js'
import { access } from 'node:fs'

const app = express()
app.use(express.json())
app.disable('x-powered-by')

const ACEPTED_ORIGINS = [
    'http://localhost:3000',
    'https://my-fake-movie-app.com',
    'http://localhost:8080',
    'http://localhost:1234'
    
]

// todos los recuersos que sean Movies se indentifican con /movies
app.get('/movies',(req,res) => {
    const origin = req.header('origin')
    if (ACEPTED_ORIGINS.includes(origin) || !origin){
        res.header('Access-Control-Allow-Origin', origin)
    }
    const {genre, page=1, limit=0} = req.query;
    if (genre) {
        const filteredMovies = movies.filter(
        movie => movie.genre.some(g => g.toLowerCase() === genre.toLowerCase())
        )

        const starIndex = (page - 1) * limit
        const endIndex = starIndex + limit

        const paginatedResult = filteredMovies.slice(starIndex, endIndex);

        return res.json({total:filteredMovies.length, result:paginatedResult})
    }
    res.json(movies)
})

app.get('/movies/:id', (req, res) => {//path to regexp
    const {id} = req.params
    const movie = movies.find(movie => movie.id === id)
    if (movie){return res.json(movie)}

res.status(404).json({massage:'Movie not found'})
})

app.post('/movies', (req,res) => {
    const result = validateMovie(req.body)

    if(result.error){
        return res.status(422).json({error:JSON.parse (result.
            error.message)})
    }

    const newMovie = {
        id: crypto.randomUUID(),
        ...result.data
    }
    // No es REST por que guardamos el estado 
    // de la application en memoria
    movies.push(newMovie)

    res.status(201).json(newMovie)
})

app.delete('/movies/:id', (req, res) => {
    const origin = req.header('origin')
    if (ACEPTED_ORIGINS.includes(origin) || !origin){
        res.header('Access-Control-Allow-Origin', origin)
    }
    const {id} = req.params
    const movieIndex = movies.findIndex(movie => movie.id === id)

    if(movieIndex === -1){
        return res.status(404).json({message: 'Movie not found'})
    }

    movies.splice(movieIndex,1)

    return res.json({message: 'Movie deleted'})
})

app.patch('/movies/:id', (req, res) => {
    const result = validateParcialMovie(req.body)
    
    if(!result.success){
        return res.status(404).json({error:JSON.parse(result.error.message)})
    }

    const {id} = req.params
    const movieIndex = movies.findIndex(movie => movie.id === id)
    
    if(movieIndex === -1){
        return res.status(404).json({message:'Movie not found'})
    }

    const updateMovie = {
        ...movies[movieIndex],
        ...result.data
        
    }

    movies[movieIndex] = updateMovie

    return res.json(updateMovie)

})

app.options('/movies/:id', (req,res) =>{
    const origin = req.header('origin')
    
    if (ACEPTED_ORIGINS.includes(origin) || !origin){
        res.header('Access-Control-Allow-Origin', origin)
        res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE')
    }
    res.send(200)
})


const PORT =process.env.PORT ?? 1234

app.listen(PORT, () => {
    console.log(`Server liseting on port http://localhost:${PORT}`)
})
