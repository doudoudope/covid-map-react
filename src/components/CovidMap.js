import React from "react";
import GoogleMapReact from 'google-map-react';
import { CovidDataService } from "../service/CovidDataService";
import { MapUtils } from "../utils/MapUtils";
import CovidCard from "./CovidCard";


export default function CovidMap(){
  const defaultProps = {
    center: {
      lat: 40,
      lng: -100
    },
    zoom: 6
  };
  // 一切有状态的变量，一旦有变量发生改变，就会updating
  // points: {country, state, county}
  const [zoomLevel,setZoomLevel] = React.useState(6)
  const [boundary,setBoundary] = React.useState({})
  const [points,setPoints] = React.useState({})

  //写一个函数，这个函数专门用来生成list of covidcard (应该被render到当前页面下)
  const renderCovidPoints = function() {
    // return list of covid card display on current visiable area
    let result = []
    // zoom level  -> determine nation/ state / county
    // 1 - 4 nation level
    // 5 - 9 state level
    // 10 - 20 county level
    if (zoomLevel < 1 || zoomLevel > 20) {
        return result
    }
    let pointsLevel = "county"
    if (zoomLevel >= 1 && zoomLevel <= 4) {
        pointsLevel = "nation"
    } else if (zoomLevel > 4 && zoomLevel <= 9) {
        pointsLevel = "state"
    }
    const pointsToRender = points[pointsLevel]
    // sanity check
    // first time render covid map component, but points data not ready
    if (!pointsToRender) {
        return result
    }

    if (pointsLevel === "county") {
        for(const point of pointsToRender) {
            // if this point is within boundary
            if (MapUtils.isInBoundary(boundary, point.coordinates)) {
                result.push(
                    <CovidCard 
                        lat = {point.coordinates.latitude}
                        lng = {point.coordinates.longitude}
                        subTitle = {point.province}
                        title = {point.county}
                        confirmed = {point.stats.confirmed}
                        deaths = {point.stats.deaths}
                    />
                )
            }
        }
    } else if (pointsLevel === "state") {
        // if this point is within current boundary
        for (const state in pointsToRender) {
            const point = pointsToRender[state]
            if (MapUtils.isInBoundary(boundary, point.coordinates)) {
                result.push(
                    <CovidCard 
                        lat = {point.coordinates.latitude}
                        lng = {point.coordinates.longitude}
                        subTitle = {point.country}
                        title = {state}
                        confirmed = {point.confirmed}
                        deaths = {point.deaths}
                    />
                )
            }
        }
    } else {
        for (const nation in pointsToRender) {
            const point = pointsToRender[nation]
            if (MapUtils.isInBoundary(boundary, point.coordinates)){
                result.push(
                    <CovidCard 
                        lat = {point.coordinates.latitude}
                        lng = {point.coordinates.longitude}
                        //subTitle = {point.country}
                        title = {nation}
                        confirmed = {point.confirmed}
                        deaths = {point.deaths}
                    />
                )
            }
        }
    }

    return result

  }
//   state = {
//     zoomlevel:6,
//     boundary: {},
//     points:{}
//   }

  return (
    // Important! Always set the container height explicitly
    <div style={{ height: '100vh', width: '100%' }}>
      <GoogleMapReact
        bootstrapURLKeys={{ key: }}
        defaultCenter={defaultProps.center}
        defaultZoom={defaultProps.zoom}
        onGoogleApiLoaded = {
            () => {
                //google map loaded -> call api to get covid data
                CovidDataService.getAllCountyCases()
                    .then(response => {
                        //成功的回掉函数：setState(points)
                        setPoints(MapUtils.convertCovidPoints(response.data))
                    }).catch(error => {
                        //失败的回调函数
                        console.error(error)
                    })
            }
        }
        onChange = {
            ({ center, zoom, bounds, marginBounds }) => {
                setZoomLevel(zoom)
                setBoundary(bounds)
            }
        }
      >
        {renderCovidPoints()}
      </GoogleMapReact>
    </div>
  );

  
}
