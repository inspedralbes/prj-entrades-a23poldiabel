<?php

use App\Http\Controllers\ApiController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/register', [ApiController::class, 'register']);
Route::post('/auth/login', [ApiController::class, 'login']);
Route::get('/auth/me', [ApiController::class, 'me']);

Route::get('/events', [ApiController::class, 'events']);
Route::get('/events/{id}', [ApiController::class, 'eventDetail']);
Route::get('/seients/{eventId}', [ApiController::class, 'seients']);
Route::get('/zones', [ApiController::class, 'zones']);

Route::get('/entrades/usuari', [ApiController::class, 'entradesUsuari']);
Route::get('/entrades/correu', [ApiController::class, 'entradesPerCorreu']);
Route::get('/reserves/usuari', [ApiController::class, 'reservesUsuari']);
Route::delete('/reserves/{id}', [ApiController::class, 'deleteReserva']);
Route::post('/compres', [ApiController::class, 'compres']);

Route::get('/admin/events', [ApiController::class, 'adminEvents']);
Route::get('/admin/events/{id}/stats', [ApiController::class, 'adminStats']);
Route::get('/admin/events/{id}/report', [ApiController::class, 'adminReport']);
Route::post('/admin/events', [ApiController::class, 'adminCreateEvent']);
Route::put('/admin/events/{id}', [ApiController::class, 'adminUpdateEvent']);
Route::delete('/admin/events/{id}', [ApiController::class, 'adminDeleteEvent']);

Route::get('/desenvolupaments', [ApiController::class, 'desenvolupaments']);
