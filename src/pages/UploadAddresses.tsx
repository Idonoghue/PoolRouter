import mapboxgl from 'mapbox-gl'
import Papa from 'papaparse'
import React, {useState} from 'react'

import 'mapbox-gl/dist/mapbox-gl.css'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN

export const UploadAddresses = () => {
	const [geocodedPoints, setGeocodedPoints] = useState<
		{lat: number; lon: number; original: string}[]
	>([])
	const mapContainer = React.useRef<HTMLDivElement | null>(null)
	const mapRef = React.useRef<mapboxgl.Map | null>(null)

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

	return (
		<div className='h-[90vh] w-[90vw]'>
			<h1>Multi-Day Route Optimizer</h1>
			<input
				accept='.csv'
				onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
					const file = e.target.files?.[0]
					if (!file) return

					const addresses = await parseCSV(file)

					setGeocodedPoints(addresses)

					if (!mapRef.current) return

					const map = mapRef.current
					if (!map) return

					const addMarkersAndZoom = (
						map: mapboxgl.Map,
						points: typeof addresses
					) => {
						const bounds = new mapboxgl.LngLatBounds()
						points.forEach(({lat, lon, original}) => {
							new mapboxgl.Marker()
								.setLngLat([lon, lat])
								.on('click', () => {
									alert(`Address: ${original}`)
								})
								.addTo(map)

							bounds.extend([lon, lat])
						})

						map.fitBounds(bounds, {padding: 50})
					}

					if (map.isStyleLoaded()) {
						addMarkersAndZoom(map, addresses)
					} else {
						map.once('load', () => addMarkersAndZoom(map, addresses))
					}
				}}
				type='file'
			/>
			<div
				className='relative flex flex-col w-full h-full'
				ref={mapContainer}
			/>
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
