<?php

namespace App\Http\Controllers;

use App\Models\Client;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:clients,name'],
            'type' => ['required', 'string', 'in:client,customer,company,individual,other'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
        ]);

        $validated['created_by'] = $request->user()->id;

        $client = Client::create($validated);

        return redirect()->back()->with('success', "Client '{$client->name}' created successfully!");
    }
}
