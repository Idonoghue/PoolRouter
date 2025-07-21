import {LoadingOrError} from 'components/LoadingOrError'
import {AddressMap} from 'pages/AddressMap'
import {lazy, Suspense} from 'react'
import {ErrorBoundary, type FallbackProps} from 'react-error-boundary'
import {Route, Routes} from 'react-router'

const Details = lazy(async () =>
	import('pages/Details').then(m => ({default: m.Details}))
)

function renderError({error}: FallbackProps) {
	return <LoadingOrError error={error} />
}

export const App = () => {
	return (
		<ErrorBoundary fallbackRender={renderError}>
			<Suspense fallback={<LoadingOrError />}>
				<Routes>
					{/* <Route element={<Gallery />} index={true} /> */}
					<Route element={<Details />} path=':fruitName' />
					<Route element={<AddressMap />} index />
				</Routes>
			</Suspense>
		</ErrorBoundary>
	)
}
