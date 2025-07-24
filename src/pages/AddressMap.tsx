/** biome-ignore-all lint/suspicious/noConsole: still testing */
import mapboxgl from 'mapbox-gl'
import Papa from 'papaparse'
import React, {useState} from 'react'

import 'mapbox-gl/dist/mapbox-gl.css'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN

export const AddressMap = () => {
	const [geocodedPoints, setGeocodedPoints] = useState<
		{lat: number; lon: number; original: string}[]
	>([])

	const mapContainer = React.useRef<HTMLDivElement | null>(null)
	const mapRef = React.useRef<mapboxgl.Map | null>(null)

	// initialize map
	React.useEffect(() => {
		if (mapRef.current || !mapContainer.current) return // prevent re-init

		const map = new mapboxgl.Map({
			container: mapContainer.current,
			style: 'mapbox://styles/mapbox/streets-v11',
			center: [-97, 38],
			hash: true,
			zoom: 3
		})

		mapRef.current = map

		map.on('load', () => {
			setTimeout(() => map.resize(), 100)
		})
	}, [])

	// if geocoded points change, update map
	React.useEffect(() => {
		if (!mapRef.current) return
		const map = mapRef.current
		if (!map) return

		const addMarkersAndZoom = (
			m: mapboxgl.Map,
			points: {lat: number; lon: number; original: string}[]
		) => {
			const bounds = new mapboxgl.LngLatBounds()
			points.forEach(({lat, lon, original}) => {
				// Create a custom div element
				const el = document.createElement('div')
				el.className = 'custom-marker' // You can style this via CSS
				el.textContent = original

				// Add inner HTML with a circle and label
				el.innerHTML = `
    <div class="marker-label">${original}</div>
    <div class="marker-dot"></div>
  `
				new mapboxgl.Marker({element: el, anchor: 'bottom'})
					.setLngLat([lon, lat])
					.addTo(m)

				bounds.extend([lon, lat])
			})

			m.fitBounds(bounds, {padding: 50})
		}

		if (map.isStyleLoaded()) {
			addMarkersAndZoom(map, geocodedPoints)
		} else {
			map.once('load', () => addMarkersAndZoom(map, geocodedPoints))
		}
	}, [geocodedPoints])

	return (
		<div className='relative w-screen h-screen'>
			<input
				accept='.csv'
				className='absolute top-0 right-0 z-10 pl-2 transition-all rounded-l-lg cursor-pointer! bg-white/50 backdrop-blur-sm hover:scale-105 text-black'
				onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
					const file = e.target.files?.[0]
					if (!file) return

					const addresses = await parseCSV(file)

					setGeocodedPoints(addresses)
				}}
				type='file'
			/>
			<div className='flex flex-col w-full h-full' ref={mapContainer} />
		</div>
	)
}

// returns array of geocoded addresses given a csv file upload
const parseCSV = (
	file: File
): Promise<
	{
		lat: number
		lon: number
		original: string
	}[]
> =>
	new Promise((resolve, reject) => {
		Papa.parse(file, {
			header: false,
			skipEmptyLines: true,
			complete: results => {
				const rows = results.data as string[][]
				console.log(results)
				const addressesText = rows
					// header rows
					.slice(2)
					.map(row => row[0])
					.filter(Boolean) as string[]
				console.log(addressesText)

				Promise.all(
					addressesText.map(async address => {
						const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address.concat(' Las Cruces'))}.json?access_token=${mapboxgl.accessToken}`
						const res = await fetch(url)
						const data = await res.json()
						if (data.features?.length > 0) {
							const [lon, lat] = data.features[0].geometry.coordinates
							return {lat, lon, original: address}
						}
						return null
					})
				)
					.then(mapboxAddresses =>
						resolve(
							mapboxAddresses.filter(Boolean) as {
								lat: number
								lon: number
								original: string
							}[]
						)
					)
					.catch(reject)
			},
			error: reject
		})
	})
