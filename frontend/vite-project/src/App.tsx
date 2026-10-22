import { useState } from "react";
import type { FormEvent } from "react";

import {
  CalendarDays,
  MapPin,
  Search,
  Hotel as HotelIcon,
  LoaderCircle,
  ShieldCheck,
  ArrowUpRight,
  AlertCircle
} from "lucide-react";

type Hotel = {
  hotelId: string;
  name: string;
  price: number;
  supplier: "Supplier A" | "Supplier B";
};

type SearchResult = {
  hotels: Hotel[];
  cheapestHotel: Hotel | null;
  supplierStatus: {
    supplierA: "success" | "failed";
    supplierB: "success" | "failed";
  };
  message?: string;
};

const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:8000";

export default function App() {
  const [city, setCity] = useState("Delhi");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] =
    useState<SearchResult | null>(null);

  async function handleSearch(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setResult(null);
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/search-hotels`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            city,
            checkIn,
            checkOut
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ??
            "Unable to search hotels. Please try again."
        );
      }

      setResult(data as SearchResult);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-shell">
      <nav className="topbar">
        <a className="brand" href="#">
          <span className="brand-icon">
            <HotelIcon size={19} />
          </span>
          StaySmart<span className="brand-dot">.</span>
        </a>

        <div className="nav-note">
          <ShieldCheck size={15} />
          Smart rate comparison
        </div>
      </nav>

      <section className="hero">
        <div className="eyebrow">
          <span className="eyebrow-line" />
          YOUR NEXT STAY, FOR LESS
        </div>

        <h1>
          Find your Perfect Stay.
          <br />
          <span>At the Best Price.</span>
        </h1>

        <p className="hero-copy">
          Compare hotel rates from multiple suppliers
          in one simple search. The best available
          rate comes first.
        </p>

        <form
          className="search-panel"
          onSubmit={handleSearch}
        >
          <label className="field city-field">
            <span className="field-label">
              <MapPin size={15} />
              DESTINATION
            </span>

            <input
              value={city}
              onChange={(e) =>
                setCity(e.target.value)
              }
              placeholder="Enter a city"
              minLength={2}
              required
            />
          </label>

          <label className="field">
            <span className="field-label">
              <CalendarDays size={15} />
              CHECK-IN
            </span>

            <input
              type="date"
              value={checkIn}
              onChange={(e) =>
                setCheckIn(e.target.value)
              }
              min={new Date()
                .toISOString()
                .slice(0, 10)}
              required
            />
          </label>

          <label className="field">
            <span className="field-label">
              <CalendarDays size={15} />
              CHECK-OUT
            </span>

            <input
              type="date"
              value={checkOut}
              onChange={(e) =>
                setCheckOut(e.target.value)
              }
              min={
                checkIn ||
                new Date()
                  .toISOString()
                  .slice(0, 10)
              }
              required
            />
          </label>

          <button
            className="search-button"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <LoaderCircle
                className="spin"
                size={18}
              />
            ) : (
              <Search size={18} />
            )}

            {loading
              ? "Comparing..."
              : "Find best rate"}
          </button>
        </form>

        <div className="trust-row">
          <span>
            <span className="tiny-check">✓</span>
            Two suppliers compared
          </span>

          <span>
            <span className="tiny-check">✓</span>
            Best price highlighted
          </span>

          <span>
            <span className="tiny-check">✓</span>
            Powered by Temporal
          </span>
        </div>
      </section>

      <section className="results-section">
        <div className="section-heading">
          <div>
            <div className="section-kicker">
              SEARCH RESULTS
            </div>

            <h2>
              {result
                ? `Stays in ${city}`
                : "Ready to stay with good.."}
            </h2>
          </div>

          {result && (
            <span className="result-count">
              {result.hotels.length}{" "}
              {result.hotels.length === 1
                ? "option"
                : "options"}{" "}
              found
            </span>
          )}
        </div>

        {loading && (
          <div className="status-card">
            <div className="loader-orbit">
              <LoaderCircle
                className="spin"
                size={25}
              />
            </div>

            <h3>Comparing supplier rates</h3>

            <p>
              Temporal is coordinating both
              supplier requests in parallel.
            </p>

            <div className="supplier-progress">
              <span>
                Supplier A <i />
              </span>
              <span>
                Supplier B <i />
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="error-card">
            <AlertCircle size={22} />

            <div>
              <strong>
                We couldn't complete your search
              </strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        {result &&
          !loading &&
          result.hotels.length === 0 && (
            <div className="empty-card">
              <HotelIcon size={28} />
              <h3>No hotels found</h3>
              <p>
                Both suppliers returned no available
                hotels. Try another destination or date.
              </p>
            </div>
          )}

        {result &&
          !loading &&
          result.hotels.length > 0 && (
            <div className="hotel-grid">
              {result.hotels.map((hotel, index) => (
                <article
                  className={`hotel-card ${
                    index === 0 ? "best-card" : ""
                  }`}
                  key={`${hotel.supplier}-${hotel.hotelId}`}
                >
                  {index === 0 && (
                    <div className="best-tag">
                      BEST AVAILABLE RATE
                      <ArrowUpRight size={13} />
                    </div>
                  )}

                  <div className="hotel-art">
                    <div className="sun" />
                    <div className="building building-one" />
                    <div className="building building-two" />
                    <div className="building building-three" />

                    <div className="hotel-art-label">
                      STAYWISE SELECT
                    </div>
                  </div>

                  <div className="hotel-info">
                    <div className="supplier-pill">
                      {hotel.supplier}
                    </div>

                    <h3>{hotel.name}</h3>

                    <p className="hotel-location">
                      <MapPin size={14} />
                      {city}
                    </p>

                    <div className="price-row">
                      <div>
                        <span className="price-caption">
                          PRICE PER NIGHT
                        </span>

                        <div className="price">
                          ₹
                          {hotel.price.toLocaleString(
                            "en-IN"
                          )}
                          <small> / night</small>
                        </div>
                      </div>

                      <span className="rate-check">
                        ✓ Rate found
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

        {!result && !loading && !error && (
          <div className="placeholder-card">
            <div className="placeholder-icon">
              <Search size={25} />
            </div>

            <div>
              <h3>Your next perfect stay</h3>
              <p>
                Enter your destination and dates above
                to compare prices from Supplier A and
                Supplier B.
              </p>
            </div>

            <div className="placeholder-decoration">
              ✳
            </div>
          </div>
        )}
      </section>

      <footer>
        <a className="brand footer-brand" href="#">
          <span className="brand-icon">
            <HotelIcon size={16} />
          </span>
          StaySmart<span className="brand-dot">.</span>
        </a>

        <span>
         Made with ❤️ by Saransh
        </span>

        <span className="footer-temporal">
          <span className="status-dot" />
          Temporal workflow ready
        </span>
      </footer>
    </main>
  );
}